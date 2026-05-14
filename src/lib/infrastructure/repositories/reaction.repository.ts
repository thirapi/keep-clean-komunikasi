import { db } from "@/lib/db";
import { messageReactions } from "@/lib/infrastructure/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { IReactionRepository } from "@/lib/application/repositories/reaction.repository.interface";
import { MessageReactionRecord, MessageReactionWithUserDTO } from "@/lib/entities/models/reaction.model";
import { createId } from "@paralleldrive/cuid2";

export class ReactionRepository implements IReactionRepository {
  constructor(private client: typeof db) { }

  async toggleReaction(userId: string, messageId: string, emoji: string): Promise<{ action: "added" | "removed", reaction: MessageReactionWithUserDTO }> {
    const existing = await this.client.query.messageReactions.findFirst({
      where: and(
        eq(messageReactions.userId, userId),
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.emoji, emoji)
      ),
      with: {
        user: {
          columns: {
            username: true,
          },
        },
      },
    });

    if (existing) {
      await this.client
        .delete(messageReactions)
        .where(eq(messageReactions.id, existing.id));
      return { action: "removed", reaction: existing as unknown as MessageReactionWithUserDTO };
    }

    const id = createId();
    await this.client.insert(messageReactions).values({
      id,
      userId,
      messageId,
      emoji,
    });

    const newReaction = await this.client.query.messageReactions.findFirst({
      where: eq(messageReactions.id, id),
      with: {
        user: {
          columns: {
            username: true,
          },
        },
      },
    });

    if (!newReaction) throw new Error("Failed to retrieve created reaction");

    return { action: "added", reaction: newReaction as unknown as MessageReactionWithUserDTO };
  }

  async getReactionsByMessageId(messageId: string): Promise<MessageReactionWithUserDTO[]> {
    const reactions = await this.client.query.messageReactions.findMany({
      where: eq(messageReactions.messageId, messageId),
      with: {
        user: {
          columns: {
            username: true,
          },
        },
      },
    });
    return reactions as unknown as MessageReactionWithUserDTO[];
  }
}
