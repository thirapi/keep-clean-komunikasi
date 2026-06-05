import { db } from "@/lib/db";
import { customEmojis } from "@/lib/infrastructure/drizzle/schema";
import { eq } from "drizzle-orm";
import { ICustomEmojiRepository } from "@/lib/application/repositories/custom-emoji.repository.interface";
import { CustomEmojiDTO } from "@/app/emoji.action";
import { createId } from "@paralleldrive/cuid2";

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

    async upsert(emoji: { shortcode: string; url: string; category?: string }): Promise<void> {
        await db.insert(customEmojis).values({
            id: createId(),
            shortcode: emoji.shortcode,
            url: emoji.url,
            category: emoji.category || "federated",
            isStatic: true,
            updatedAt: new Date(),
        }).onConflictDoUpdate({
            target: customEmojis.shortcode,
            set: {
                url: emoji.url,
                updatedAt: new Date(),
            },
        });
    }
}
