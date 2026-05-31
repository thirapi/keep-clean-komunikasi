import { NotificationRepository } from "@/lib/infrastructure/repositories/notification.repository";
import { GetNotificationsUseCase } from "@/lib/application/use-cases/notifications/get-notifications.use-case";
import { db } from "@/lib/db";

const notificationRepository = new NotificationRepository(db);
const getNotificationsUseCase = new GetNotificationsUseCase(notificationRepository);

export const getNotificationsController = async (recipientId: string, limit = 20, offset = 0) => {
    return await getNotificationsUseCase.execute(recipientId, limit, offset);
};

export const getUnreadNotificationsCountController = async (recipientId: string) => {
    return await getNotificationsUseCase.getUnreadCount(recipientId);
};
