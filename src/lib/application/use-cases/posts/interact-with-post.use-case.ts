import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { IPusherService } from "@/lib/application/services/pusher.service.interface";
import { createId } from "@paralleldrive/cuid2";
import { PostRecord, PostWithUserDTO } from "@/lib/entities/models/post.model";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts } from "@/lib/infrastructure/drizzle/schema";

export class InteractWithPostUseCase {
    constructor(
        private postRepository: IPostRepository,
        private pusherService: IPusherService
    ) { }

    async toggleLike(postId: string, userId: string, optimisticId?: string): Promise<PostWithUserDTO | null> {
        const post = await this.postRepository.findByIdWithDetails(postId);
        if (!post) throw new Error("Post not found");

        const hasLiked = post.reactions?.some(r => r.userId === userId && r.emoji === "❤️");

        if (hasLiked) {
            await this.postRepository.removeReaction(postId, userId, "❤️");
        } else {
            await this.postRepository.addReaction(postId, userId, "❤️");
        }

        // Trigger real-time update
        const updatedPost = await this.postRepository.findByIdWithDetails(postId, userId);
        if (updatedPost) {
            updatedPost.optimisticId = optimisticId;
            await this.pusherService.trigger(`post-${postId}`, "reaction-updated", updatedPost);
        }

        return updatedPost;
    }

    async repost(userId: string, originalPostId: string, optimisticId?: string): Promise<PostWithUserDTO | null> {
        const result = await db.transaction(async (tx) => {
            // Strict check within transaction to prevent race conditions
            const existingRepost = await tx.query.posts.findFirst({
                where: and(
                    eq(posts.userId, userId),
                    eq(posts.repostOfId, originalPostId),
                    eq(posts.isDeleted, false)
                )
            });

            if (existingRepost) {
                // Undo Repost: Soft delete the record
                await tx.update(posts)
                    .set({ isDeleted: true, updatedAt: new Date() })
                    .where(eq(posts.id, existingRepost.id));

                return { type: "unrepost" as const, id: originalPostId };
            }

            // Create Repost Record
            const id = optimisticId || createId();
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.verdi";
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
            return { type: "repost" as const, id: id };
        });

        // Outside transaction, fetch fully loaded details using repository
        // This ensures the record is committed and visible to the repository's client
        if (result.type === "unrepost") {
            const originalPost = await this.postRepository.findByIdWithDetails(result.id, userId);
            if (originalPost) {
                originalPost.optimisticId = optimisticId;
                await this.pusherService.trigger(`post-${result.id}`, "reaction-updated", originalPost);
            }
            return null;
        } else {
            const postWithDetails = await this.postRepository.findByIdWithDetails(result.id, userId);
            if (!postWithDetails) throw new Error("Failed to fetch created repost");

            postWithDetails.optimisticId = optimisticId;
            await this.pusherService.trigger("global-feed", "new-post", postWithDetails);
            await this.pusherService.trigger(`user-posts-${userId}`, "new-post", postWithDetails);

            const updatedOriginal = await this.postRepository.findByIdWithDetails(originalPostId, userId);
            if (updatedOriginal) {
                await this.pusherService.trigger(`post-${originalPostId}`, "reaction-updated", updatedOriginal);
            }

            return postWithDetails;
        }
    }
}
