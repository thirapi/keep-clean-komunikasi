import { MessageReactionRecord, MessageReactionWithUserDTO } from "@/lib/entities/models/reaction.model";

export interface IReactionRepository {
  toggleReaction(userId: string, messageId: string, emoji: string): Promise<{ action: "added" | "removed", reaction: MessageReactionWithUserDTO }>;
  getReactionsByMessageId(messageId: string): Promise<MessageReactionWithUserDTO[]>;
}
