import { INotificationRepository } from "@/lib/application/repositories/notification.repository.interface";

export class GetNotificationsUseCase {
    constructor(private notificationRepository: INotificationRepository) { }

    async execute(recipientId: string, limit = 20, offset = 0) {
        if (!recipientId) throw new Error("Recipient ID is required");

        const notifications = await this.notificationRepository.findByRecipientId(recipientId, limit, offset);
        
        // Mark these notifications as read when fetched
        await this.notificationRepository.markAllAsRead(recipientId);

        return notifications;
    }

    async getUnreadCount(recipientId: string) {
        return await this.notificationRepository.countUnread(recipientId);
    }
}
