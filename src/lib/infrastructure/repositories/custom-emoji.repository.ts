import { db } from "@/lib/db";
import { customEmojis } from "@/lib/infrastructure/drizzle/schema";
import { ICustomEmojiRepository, CustomEmojiRecord } from "@/lib/application/repositories/custom-emoji.repository.interface";

export class CustomEmojiRepository implements ICustomEmojiRepository {
    constructor(private client: typeof db) {}

    async findAll(): Promise<CustomEmojiRecord[]> {
        // Only the four fields the client renders. This runs on every
        // authenticated page load, and the default selection also shipped
        // createdAt/updatedAt/id/isStatic for the whole table.
        const results = await this.client.query.customEmojis.findMany({
            columns: {
                shortcode: true,
                url: true,
                category: true,
                isStatic: true,
            },
        });
        return results as CustomEmojiRecord[];
    }
}
