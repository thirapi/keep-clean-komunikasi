import { NotificationRecord } from "@/lib/entities/models/notification.model";

export interface INotificationRepository {
    create(notification: NotificationRecord): Promise<void>;
    findByRecipientId(recipientId: string, limit?: number, offset?: number): Promise<any[]>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(recipientId: string): Promise<void>;
    countUnread(recipientId: string): Promise<number>;
}
