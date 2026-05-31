import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { IActivityPubService } from "@/lib/application/services/activitypub.service.interface";
import { IRemoteActorRepository } from "@/lib/application/repositories/remote-actor.repository.interface";
import { INotificationRepository } from "@/lib/application/repositories/notification.repository.interface";
import { IPusherService } from "@/lib/application/services/pusher.service.interface";
import { createId } from "@paralleldrive/cuid2";
import { PostRecord, PostWithUserDTO } from "@/lib/entities/models/post.model";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts } from "@/lib/infrastructure/drizzle/schema";

export class InteractWithPostUseCase {
    constructor(
        private postRepository: IPostRepository,
        private activityPubService: IActivityPubService,
        private remoteActorRepository: IRemoteActorRepository,
        private notificationRepository: INotificationRepository,
        private pusherService: IPusherService
    ) { }

    async toggleLike(postId: string, userId: string, optimisticId?: string): Promise<PostWithUserDTO | null> {
        if (!userId) throw new Error("User ID is required for local interactions");

        const post = await this.postRepository.findByIdWithDetails(postId);
        if (!post) throw new Error("Post not found");

        const hasLiked = post.reactions?.some(r => r.userId === userId && r.emoji === "❤️");

        await db.transaction(async (tx) => {
            const postReactionsTable = (await import("@/lib/infrastructure/drizzle/schema")).postReactions;
            
            const existing = await tx.query.postReactions.findFirst({
                where: and(
                    eq(postReactionsTable.postId, postId),
                    eq(postReactionsTable.userId, userId),
                    eq(postReactionsTable.emoji, "❤️")
                )
            });

            if (existing) {
                await tx.delete(postReactionsTable).where(
                    and(
                        eq(postReactionsTable.postId, postId),
                        eq(postReactionsTable.userId, userId),
                        eq(postReactionsTable.emoji, "❤️")
                    )
                );
            } else {
                await tx.insert(postReactionsTable).values({
                    id: createId(),
                    postId,
                    userId,
                    emoji: "❤️"
                }).onConflictDoNothing();

                // Notification: Only if the recipient is a local user and not the actor
                if (post.userId && post.userId !== userId) {
                    const notificationId = createId();
                    await tx.insert((await import("@/lib/infrastructure/drizzle/schema")).notifications).values({
                        id: notificationId,
                        recipientId: post.userId,
                        actorId: userId,
                        type: "like",
                        targetId: postId,
                        targetType: "post",
                        isRead: false,
                        createdAt: new Date()
                    });

                    // Trigger Pusher
                    await this.pusherService.trigger(`user-${post.userId}`, "new-notification", {
                        id: notificationId,
                        type: "like",
                        actorId: userId
                    });
                }
            }
        });

        // Fediverse Compatibility: Send Like/Undo activity
        if (post.uri && post.remoteActorId) {
            try {
                const actor = await this.remoteActorRepository.findById(post.remoteActorId);
                if (actor?.inbox) {
                    if (hasLiked) {
                        await this.activityPubService.sendUndoLikeActivity(userId, post.uri, actor.inbox);
                    } else {
                        await this.activityPubService.sendLikeActivity(userId, post.uri, actor.inbox);
                    }
                }
            } catch (err) {
                console.error("Failed to send Like activity:", err);
            }
        }

        // Outside transaction, fetch fully loaded details using repository
        const updatedPost = await this.postRepository.findByIdWithDetails(postId, userId);
        if (updatedPost) {
            updatedPost.optimisticId = optimisticId;
        }

        return updatedPost;
    }

    async repost(userId: string, originalPostId: string, optimisticId?: string): Promise<PostWithUserDTO | null> {
        if (!userId) throw new Error("User ID is required for local interactions");

        const originalPost = await this.postRepository.findByIdWithDetails(originalPostId);
        if (!originalPost) throw new Error("Original post not found");

        const result = await db.transaction(async (tx) => {
            // Strict check within transaction to prevent race conditions
            const existingRepost = await tx.query.posts.findFirst({
                where: and(
                    eq(posts.userId, userId),
                    eq(posts.repostOfId, originalPostId),
                    eq(posts.isDeleted, false),
                    eq(posts.content, "")
                )
            });

            if (existingRepost) {
                // Undo Repost: Soft delete the record
                await tx.update(posts)
                    .set({ isDeleted: true, updatedAt: new Date() })
                    .where(eq(posts.id, existingRepost.id));

                return { type: "unrepost" as const, id: originalPostId, repostUri: existingRepost.uri };
            }

            // Create Repost Record
            const id = optimisticId || createId();
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
            const uri = `${baseUrl}/users/${userId}/posts/${id}`;

            const repostRecord: PostRecord = {
                id,
                userId,
                content: "",
                uri,
                url: uri,
                repostOfId: originalPostId,
                visibility: "public",
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await tx.insert(posts).values(repostRecord);

            // Notification: Only if recipient is a local user and not the actor
            if (originalPost.userId && originalPost.userId !== userId) {
                const notificationId = createId();
                await tx.insert((await import("@/lib/infrastructure/drizzle/schema")).notifications).values({
                    id: notificationId,
                    recipientId: originalPost.userId,
                    actorId: userId,
                    type: "repost",
                    targetId: originalPostId,
                    targetType: "post",
                    isRead: false,
                    createdAt: new Date()
                });

                // Trigger Pusher
                await this.pusherService.trigger(`user-${originalPost.userId}`, "new-notification", {
                    id: notificationId,
                    type: "repost",
                    actorId: userId
                });
            }

            return { type: "repost" as const, id: id, repostUri: uri };
        });

        // Fediverse Compatibility: Send Announce/Undo activity
        if (originalPost.uri && originalPost.remoteActorId) {
            try {
                const actor = await this.remoteActorRepository.findById(originalPost.remoteActorId);
                if (actor?.inbox) {
                    if (result.type === "unrepost") {
                        await this.activityPubService.sendUndoAnnounceActivity(userId, originalPost.uri, actor.inbox);
                    } else {
                        await this.activityPubService.sendAnnounceActivity(userId, originalPost.uri, actor.inbox);
                    }
                }
            } catch (err) {
                console.error("Failed to send Announce activity:", err);
            }
        }

        // Always return the UPDATED ORIGINAL post to ensure UI stats are consistent
        const updatedOriginal = await this.postRepository.findByIdWithDetails(originalPostId, userId);
        if (updatedOriginal) {
            updatedOriginal.optimisticId = optimisticId;
        }
        
        return updatedOriginal;
    }
}
