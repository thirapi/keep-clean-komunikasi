import { CustomEmojiDTO } from "@/app/emoji.action";

export interface ICustomEmojiRepository {
    findByShortcode(shortcode: string): Promise<CustomEmojiDTO | null>;
    findAll(): Promise<CustomEmojiDTO[]>;
}
