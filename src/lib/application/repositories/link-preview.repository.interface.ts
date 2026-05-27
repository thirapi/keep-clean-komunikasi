import { PostLinkPreview } from "@/lib/entities/models/post.model";

export interface ILinkPreviewRepository {
    create(preview: Omit<PostLinkPreview, "id" | "createdAt">): Promise<PostLinkPreview>;
    findByPostId(postId: string): Promise<PostLinkPreview[]>;
}
