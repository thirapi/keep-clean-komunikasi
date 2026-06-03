"use server";

import { db } from "@/lib/db";
import { customEmojis } from "@/lib/infrastructure/drizzle/schema";
import { ServerResponse } from "@/lib/entities/models/response.model";

export interface CustomEmojiDTO {
    shortcode: string;
    url: string;
    category: string;
}

export async function getCustomEmojisAction(): Promise<ServerResponse<CustomEmojiDTO[]>> {
    try {
        const results = await db.query.customEmojis.findMany({
            columns: {
                shortcode: true,
                url: true,
                category: true,
            },
            orderBy: (emojis, { asc }) => [asc(emojis.category), asc(emojis.shortcode)],
        });

        return {
            status: "success",
            data: results,
            error: null,
        };
    } catch (error: any) {
        return {
            status: "error",
            data: [],
            error: {
                message: error.message || "Failed to fetch custom emojis",
                type: error.constructor.name,
            },
        };
    }
}
