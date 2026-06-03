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
        return this.toggleReaction(postId, userId, "❤️", optimisticId);
    }

    async toggleReaction(postId: string, userId: string, emoji: string, optimisticId?: string): Promise<PostWithUserDTO | null> {
        if (!userId) throw new Error("User ID is required for local interactions");

        const post = await this.postRepository.findByIdWithDetails(postId);
        if (!post) throw new Error("Post not found");

        const existingReaction = post.reactions?.find(r => r.userId === userId);

        await db.transaction(async (tx) => {
            const postReactionsTable = (await import("@/lib/infrastructure/drizzle/schema")).postReactions;
            
            // Delete ANY existing reaction for this user on this post to ensure exclusivity
            await tx.delete(postReactionsTable).where(
                and(
                    eq(postReactionsTable.postId, postId),
                    eq(postReactionsTable.userId, userId)
                )
            );

            // If the user didn't have this exact reaction before, insert it (Switching or New)
            if (!existingReaction || existingReaction.emoji !== emoji) {
                await tx.insert(postReactionsTable).values({
                    id: createId(),
                    postId,
                    userId,
                    emoji
                }).onConflictDoNothing();

                // Notification: Only if the recipient is a local user and not the actor
                if (post.userId && post.userId !== userId) {
                    const notificationId = createId();
                    const type = emoji === "❤️" ? "like" : "reaction";
                    await tx.insert((await import("@/lib/infrastructure/drizzle/schema")).notifications).values({
                        id: notificationId,
                        recipientId: post.userId,
                        actorId: userId,
                        type,
                        emoji,
                        targetId: postId,
                        targetType: "post",
                        isRead: false,
                        createdAt: new Date()
                    });

                    // Trigger Pusher
                    await this.pusherService.trigger(`user-${post.userId}`, "new-notification", {
                        id: notificationId,
                        type,
                        actorId: userId,
                        emoji
                    });
                }
            }
        });

        // Fediverse Compatibility: Send Reaction/Undo activities
        if (post.uri && post.remoteActorId) {
            try {
                const actor = await this.remoteActorRepository.findById(post.remoteActorId);
                if (actor?.inbox) {
                    // 1. If had an existing reaction, always send Undo for it first
                    if (existingReaction) {
                        if (existingReaction.emoji === "❤️") {
                            await this.activityPubService.sendUndoLikeActivity(userId, post.uri, actor.inbox);
                        } else {
                            await this.activityPubService.sendUndoEmojiReactionActivity(userId, post.uri, actor.inbox, existingReaction.emoji);
                        }
                    }

                    // 2. If we are setting a NEW (or different) reaction, send the new activity
                    if (!existingReaction || existingReaction.emoji !== emoji) {
                        if (emoji === "❤️") {
                            await this.activityPubService.sendLikeActivity(userId, post.uri, actor.inbox);
                        } else {
                            await this.activityPubService.sendEmojiReactionActivity(userId, post.uri, actor.inbox, emoji);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to federate interaction activity:", err);
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

            return { type: "repost" as const, id: id, repostUri: uri, record: repostRecord };
        });

        // Fediverse Compatibility: Broadcast Announce/Undo activity
        try {
            if (result.type === "repost" && result.record) {
                const activity = await this.activityPubService.createAnnounceActivity(userId, result.record);
                await this.activityPubService.broadcastActivity(activity, userId);
            } else if (result.type === "unrepost") {
                // Send Undo Announce to the original author at minimum
                if (originalPost.uri && originalPost.remoteActorId) {
                    const actor = await this.remoteActorRepository.findById(originalPost.remoteActorId);
                    if (actor?.inbox) {
                        await this.activityPubService.sendUndoAnnounceActivity(userId, originalPost.uri, actor.inbox);
                    }
                }
                // Note: Full Undo broadcast to followers would require more state, 
                // but at least author is notified.
            }
        } catch (err) {
            console.error("Failed to federate repost activity:", err);
        }

        // Always return the UPDATED ORIGINAL post to ensure UI stats are consistent
        const updatedOriginal = await this.postRepository.findByIdWithDetails(originalPostId, userId);
        if (updatedOriginal) {
            updatedOriginal.optimisticId = optimisticId;
        }
        
        return updatedOriginal;
    }
}
