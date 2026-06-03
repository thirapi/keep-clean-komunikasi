import { db } from "@/lib/db";
import { customEmojis } from "@/lib/infrastructure/drizzle/schema";
import { eq } from "drizzle-orm";
import { ICustomEmojiRepository } from "@/lib/application/repositories/custom-emoji.repository.interface";
import { CustomEmojiDTO } from "@/app/emoji.action";

export class CustomEmojiRepository implements ICustomEmojiRepository {
    async findByShortcode(shortcode: string): Promise<CustomEmojiDTO | null> {
        const result = await db.query.customEmojis.findFirst({
            where: eq(customEmojis.shortcode, shortcode),
            columns: {
                shortcode: true,
                url: true,
                category: true,
            },
        });
        return result || null;
    }

    async findAll(): Promise<CustomEmojiDTO[]> {
        return await db.query.customEmojis.findMany({
            columns: {
                shortcode: true,
                url: true,
                category: true,
            },
            orderBy: (emojis, { asc }) => [asc(emojis.category), asc(emojis.shortcode)],
        });
    }
}
