import { db } from "@/lib/db";
import { messageReactions, users } from "@/lib/infrastructure/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { IReactionRepository } from "@/lib/application/repositories/reaction.repository.interface";
import { MessageReactionWithUserDTO } from "@/lib/entities/models/reaction.model";
import { createId } from "@paralleldrive/cuid2";

export class ReactionRepository implements IReactionRepository {
    constructor(private client: typeof db) { }

    async toggleReaction(userId: string, messageId: string, emoji: string): Promise<{
        action: "added" | "removed";
        reaction: MessageReactionWithUserDTO | null;
    }> {
        const existing = await this.client.query.messageReactions.findFirst({
            where: and(
                eq(messageReactions.messageId, messageId),
                eq(messageReactions.userId, userId),
                eq(messageReactions.emoji, emoji)
            ),
        });

        if (existing) {
            await this.client.delete(messageReactions)
                .where(eq(messageReactions.id, existing.id));
            return { action: "removed", reaction: null };
        }

        const id = createId();
        const now = new Date();
        await this.client.insert(messageReactions).values({
            id,
            messageId,
            userId,
            emoji,
            createdAt: now,
            updatedAt: now,
        });

        const reaction = await this.client.query.messageReactions.findFirst({
            where: eq(messageReactions.id, id),
            with: {
                user: {
                    columns: {
                        username: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });

        return { action: "added", reaction: reaction as MessageReactionWithUserDTO | null };
    }

    async findByMessageId(messageId: string): Promise<MessageReactionWithUserDTO[]> {
        const results = await this.client.query.messageReactions.findMany({
            where: eq(messageReactions.messageId, messageId),
            with: {
                user: {
                    columns: {
                        username: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });
        return results as MessageReactionWithUserDTO[];
    }
}
