import { db } from "@/lib/db";
import { notifications, users, remoteActors, posts } from "@/lib/infrastructure/drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { INotificationRepository } from "@/lib/application/repositories/notification.repository.interface";
import { NotificationRecord } from "@/lib/entities/models/notification.model";

export class NotificationRepository implements INotificationRepository {
    constructor(private client: typeof db) { }

    async create(notification: NotificationRecord): Promise<void> {
        await this.client.insert(notifications).values(notification);
    }

    async findByRecipientId(recipientId: string, limit = 20, offset = 0): Promise<any[]> {
        return await this.client.query.notifications.findMany({
            where: eq(notifications.recipientId, recipientId),
            orderBy: [desc(notifications.createdAt)],
            limit,
            offset,
            with: {
                actor: {
                    columns: { username: true, avatar: true },
                },
                remoteActor: true,
                post: {
                    columns: { content: true },
                },
            },
        });
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
