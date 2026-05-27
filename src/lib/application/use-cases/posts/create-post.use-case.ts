import { PostRecord, PostWithUserDTO } from "@/lib/entities/models/post.model";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { IPusherService } from "@/lib/application/services/pusher.service.interface";
import { ILinkPreviewRepository } from "@/lib/application/repositories/link-preview.repository.interface";
import { ILinkPreviewService } from "@/lib/application/services/link-preview.service.interface";
import { IActivityPubService } from "@/lib/application/services/activitypub.service.interface";
import { HashtagRepository } from "@/lib/infrastructure/repositories/hashtag.repository";
import { createId } from "@paralleldrive/cuid2";
import { extractUrls } from "@/lib/extract-urls";
import { extractHashtags } from "@/lib/extract-hashtags";

export class CreatePostUseCase {
    constructor(
        private postRepository: IPostRepository,
        private pusherService: IPusherService,
        private linkPreviewRepository: ILinkPreviewRepository,
        private linkPreviewService: ILinkPreviewService,
        private hashtagRepository: HashtagRepository,
        private activityPubService: IActivityPubService
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
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
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

        // Fediverse Compatibility: Broadcast activity
        try {
            const activity = await this.activityPubService.createNoteActivity(userId, postRecord);
            await this.activityPubService.broadcastActivity(activity, userId);
        } catch (err) {
            console.error("Failed to broadcast ActivityPub activity:", err);
        }

        // Extract and save URLs
        const urls = extractUrls(content);
        if (urls.length > 0) {
            for (const url of urls.slice(0, 3)) {
                try {
                    const preview = await this.linkPreviewService.getPreview(url);
                    if (preview) {
                        await this.linkPreviewRepository.create({
                            postId: id,
                            url: preview.url,
                            title: preview.title,
                            description: preview.description,
                            image: preview.image,
                            siteName: preview.siteName,
                        });
                    }
                } catch (err) {
                    console.error(`Failed to fetch preview for ${url}:`, err);
                }
            }
        }

        // Extract and save hashtags
        const hashtags = extractHashtags(content);
        for (const tag of hashtags) {
            const tagId = await this.hashtagRepository.getOrCreate(tag);
            await this.hashtagRepository.associate(id, tagId);
        }

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
