import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { IPusherService } from "@/lib/application/services/pusher.service.interface";
import { createId } from "@paralleldrive/cuid2";
import { PostRecord, PostWithUserDTO } from "@/lib/entities/models/post.model";

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
        // Check if already reposted
        const existingRepost = await this.postRepository.findRepost(userId, originalPostId);

        if (existingRepost) {
            // Undo Repost
            await this.postRepository.delete(existingRepost.id);

            // Fetch original post to trigger update on UI
            const originalPost = await this.postRepository.findByIdWithDetails(originalPostId, userId);
            if (originalPost) {
                originalPost.optimisticId = optimisticId;
                await this.pusherService.trigger(`post-${originalPostId}`, "reaction-updated", originalPost);
            }
            
            return null;
        }

        const originalPost = await this.postRepository.findById(originalPostId);
        if (!originalPost) throw new Error("Original post not found");

        const id = createId();
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

        await this.postRepository.create(repostRecord);
        const postWithDetails = await this.postRepository.findByIdWithDetails(id, userId);

        if (!postWithDetails) throw new Error("Failed to create repost");

        postWithDetails.optimisticId = optimisticId;
        await this.pusherService.trigger("global-feed", "new-post", postWithDetails);
        await this.pusherService.trigger(`user-posts-${userId}`, "new-post", postWithDetails);
        
        // Also notify the original post channel about the new repost count
        const updatedOriginal = await this.postRepository.findByIdWithDetails(originalPostId, userId);
        if (updatedOriginal) {
            await this.pusherService.trigger(`post-${originalPostId}`, "reaction-updated", updatedOriginal);
        }

        return postWithDetails;
    }
}
