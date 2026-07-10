import { db } from "@/lib/db";
import { customEmojis } from "@/lib/infrastructure/drizzle/schema";
import { ICustomEmojiRepository, CustomEmojiRecord } from "@/lib/application/repositories/custom-emoji.repository.interface";

export class CustomEmojiRepository implements ICustomEmojiRepository {
    constructor(private client: typeof db) {}

    async findAll(): Promise<CustomEmojiRecord[]> {
        const results = await this.client.query.customEmojis.findMany();
        return results as CustomEmojiRecord[];
    }
}
