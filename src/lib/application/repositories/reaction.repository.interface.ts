import { MessageReactionWithUserDTO } from "@/lib/entities/models/reaction.model";

export interface IReactionRepository {
    toggleReaction(userId: string, messageId: string, emoji: string): Promise<{
        action: "added" | "removed";
        reaction: MessageReactionWithUserDTO | null;
    }>;
    findByMessageId(messageId: string): Promise<MessageReactionWithUserDTO[]>;
}
