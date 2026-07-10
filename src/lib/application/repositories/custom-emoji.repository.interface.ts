export interface CustomEmojiRecord {
    id: string;
    shortcode: string;
    url: string;
    category: string;
    isStatic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICustomEmojiRepository {
    findAll(): Promise<CustomEmojiRecord[]>;
}
