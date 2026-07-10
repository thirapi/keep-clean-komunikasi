"use server";

import { db } from "@/lib/db";
import { CustomEmojiRepository } from "@/lib/infrastructure/repositories/custom-emoji.repository";
import { ServerResponse } from "@/lib/entities/models/response.model";

const emojiRepo = new CustomEmojiRepository(db);

export interface CustomEmojiDTO {
    shortcode: string;
    url: string;
    category: string;
    isStatic: boolean;
}

export async function getCustomEmojisAction(): Promise<ServerResponse<CustomEmojiDTO[]>> {
    try {
        const emojis = await emojiRepo.findAll();
        return {
            status: "success",
            data: emojis.map(e => ({
                shortcode: e.shortcode.replace(/^:|:$/g, ""),
                url: e.url,
                category: e.category,
                isStatic: e.isStatic,
            })),
            error: null,
        };
    } catch (err: any) {
        return { status: "error", data: [], error: { message: err.message, type: err.constructor.name } };
    }
}
