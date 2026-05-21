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
        attachments?: { url: string; key: string; fileType: string; size?: number }[]
    ): Promise<PostWithUserDTO> {
        const id = createId();

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

        await this.postRepository.create(postRecord);

        const postWithDetails = await this.postRepository.findByIdWithDetails(id);

        if (!postWithDetails) {
            throw new Error("Failed to create post");
        }

        // Trigger real-time update (Global Feed or Profile Feed)
        await this.pusherService.trigger("global-feed", "new-post", postWithDetails);
        await this.pusherService.trigger(`user-posts-${userId}`, "new-post", postWithDetails);

        return postWithDetails;
    }
}
