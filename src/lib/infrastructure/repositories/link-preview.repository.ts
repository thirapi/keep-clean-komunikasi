import { ILinkPreviewRepository } from "@/lib/application/repositories/link-preview.repository.interface";
import { db } from "@/lib/db";
import { postLinkPreviews } from "@/lib/infrastructure/drizzle/schema";
import { PostLinkPreview } from "@/lib/entities/models/post.model";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export class LinkPreviewRepository implements ILinkPreviewRepository {
    constructor(private readonly _db: typeof db) { }

    async create(preview: Omit<PostLinkPreview, "id" | "createdAt">): Promise<PostLinkPreview> {
        const [result] = await this._db.insert(postLinkPreviews).values({
            id: createId(),
            ...preview,
        }).returning();
        return result as unknown as PostLinkPreview;
    }

    async findByPostId(postId: string): Promise<PostLinkPreview[]> {
        const results = await this._db.query.postLinkPreviews.findMany({
            where: eq(postLinkPreviews.postId, postId),
        });
        return results as unknown as PostLinkPreview[];
    }
}
