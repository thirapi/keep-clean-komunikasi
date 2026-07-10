export interface MessageReactionRecord {
    id: string;
    messageId: string;
    userId?: string | null;
    emoji: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface MessageReactionWithUserDTO extends MessageReactionRecord {
    user?: {
        username: string;
        name?: string | null;
        avatar?: string | null;
    } | null;
}
