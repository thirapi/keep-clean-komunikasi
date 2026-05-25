import { PostRecord, PostWithUserDTO } from "@/lib/entities/models/post.model";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { IPusherService } from "@/lib/application/services/pusher.service.interface";
import { createId } from "@paralleldrive/cuid2";

export class CreatePostUseCase {
    constructor(
        private postRepository: IPostRepository,
        private pusherService: IPusherService
    ) { }

    async execute(
        userId: string,
        content: string,
        visibility: "public" | "unlisted" | "private" = "public",
        replyToId?: string,
        repostOfId?: string,
        attachments?: { url: string; key: string; fileType: string; size?: number }[],
        predefinedId?: string
    ): Promise<PostWithUserDTO> {
        const id = predefinedId || createId();

        // In a real implementation, we'd get the base URL from env
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.verdi";
        const uri = `${baseUrl}/users/${userId}/posts/${id}`;

        const postRecord: PostRecord = {
            id,
            userId,
            content,
            uri,
            url: uri,
            visibility,
            replyToId,
            repostOfId,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await this.postRepository.create(postRecord, attachments);

        const postWithDetails = await this.postRepository.findByIdWithDetails(id, userId);

        if (!postWithDetails) {
            throw new Error("Failed to create post");
        }

        // Trigger real-time update (Global Feed or Profile Feed)
        await this.pusherService.trigger("global-feed", "new-post", postWithDetails);
        await this.pusherService.trigger(`user-posts-${userId}`, "new-post", postWithDetails);

        // If it's a quote post, also notify the original post channel about the new repost count
        if (repostOfId) {
            const updatedOriginal = await this.postRepository.findByIdWithDetails(repostOfId, userId);
            if (updatedOriginal) {
                await this.pusherService.trigger(`post-${repostOfId}`, "reaction-updated", updatedOriginal);
            }
        }

        return postWithDetails;
    }
}
