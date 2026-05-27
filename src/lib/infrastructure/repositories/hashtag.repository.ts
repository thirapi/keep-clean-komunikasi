import { db } from "@/lib/db";
import { hashtags, postHashtags } from "@/lib/infrastructure/drizzle/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export class HashtagRepository {
    constructor(private readonly _db: typeof db) { }

    async getOrCreate(name: string): Promise<string> {
        const existing = await this._db.query.hashtags.findFirst({
            where: eq(hashtags.name, name),
        });

        if (existing) return existing.id;

        const [newTag] = await this._db.insert(hashtags).values({
            id: createId(),
            name,
        }).returning();

        return newTag.id;
    }

    async associate(postId: string, hashtagId: string): Promise<void> {
        await this._db.insert(postHashtags).values({
            id: createId(),
            postId,
            hashtagId,
        }).onConflictDoNothing();
    }
}
