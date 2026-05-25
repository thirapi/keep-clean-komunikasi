import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { IPusherService } from "@/lib/application/services/pusher.service.interface";

export class DeletePostUseCase {
    constructor(
        private postRepository: IPostRepository,
        private pusherService: IPusherService
    ) { }

    async execute(postId: string, userId: string): Promise<void> {
        const post = await this.postRepository.findById(postId);

        if (!post) {
            throw new Error("Post not found");
        }

        if (post.userId !== userId) {
            throw new Error("Unauthorized to delete this post");
        }

        await this.postRepository.delete(postId);

        // Trigger real-time update to inform clients to remove the post
        await this.pusherService.trigger("global-feed", "post-deleted", { postId });
        await this.pusherService.trigger(`user-posts-${post.userId}`, "post-deleted", { postId });
        await this.pusherService.trigger(`post-${postId}`, "post-deleted", { postId });

        // If it was a reply or repost, we might want to update the parent post's counts
        if (post.replyToId) {
            const parent = await this.postRepository.findByIdWithDetails(post.replyToId, userId);
            if (parent) {
                await this.pusherService.trigger(`post-${post.replyToId}`, "reaction-updated", parent);
            }
        }

        if (post.repostOfId) {
            const original = await this.postRepository.findByIdWithDetails(post.repostOfId, userId);
            if (original) {
                await this.pusherService.trigger(`post-${post.repostOfId}`, "reaction-updated", original);
            }
        }
    }
}
