import { db } from "@/lib/db";
import { notifications, users, remoteActors, posts, customEmojis } from "@/lib/infrastructure/drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { INotificationRepository } from "@/lib/application/repositories/notification.repository.interface";
import { NotificationRecord } from "@/lib/entities/models/notification.model";

export class NotificationRepository implements INotificationRepository {
    constructor(private client: typeof db) { }

    async create(notification: NotificationRecord): Promise<void> {
        await this.client.insert(notifications).values(notification);
    }

    async findByRecipientId(recipientId: string, limit = 20, offset = 0): Promise<any[]> {
        const results = await this.client.select({
            id: notifications.id,
            recipientId: notifications.recipientId,
            actorId: notifications.actorId,
            remoteActorId: notifications.remoteActorId,
            type: notifications.type,
            emoji: notifications.emoji,
            emojiUrl: customEmojis.url, // Join emoji URL
            targetId: notifications.targetId,
            targetType: notifications.targetType,
            isRead: notifications.isRead,
            createdAt: notifications.createdAt,
            actor: {
                username: users.username,
                avatar: users.avatar,
            },
            remoteActor: {
                id: remoteActors.id,
                username: remoteActors.username,
                domain: remoteActors.domain,
                avatar: remoteActors.avatar,
            },
            post: {
                content: posts.content,
            }
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.actorId, users.id))
        .leftJoin(remoteActors, eq(notifications.remoteActorId, remoteActors.id))
        .leftJoin(posts, eq(notifications.targetId, posts.id))
        .leftJoin(customEmojis, eq(notifications.emoji, customEmojis.shortcode))
        .where(eq(notifications.recipientId, recipientId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

        return results;
    }

    async markAsRead(id: string): Promise<void> {
        await this.client.update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.id, id));
    }

    async markAllAsRead(recipientId: string): Promise<void> {
        await this.client.update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.recipientId, recipientId));
    }

    async countUnread(recipientId: string): Promise<number> {
        const result = await this.client
            .select({ count: sql<number>`count(*)` })
            .from(notifications)
            .where(and(
                eq(notifications.recipientId, recipientId),
                eq(notifications.isRead, false)
            ));
        return Number(result[0].count);
    }
}
