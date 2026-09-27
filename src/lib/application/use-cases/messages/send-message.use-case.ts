import { MessageWithUserDTO } from "../../../entities/models/message.model";
import { IMessageRepository } from "../../repositories/message.repository.interface";
import { IRoomRepository } from "../../repositories/room.repository.interface";
import { INotifierService } from "../../services/discord-notifier.service.interface";
import { IPusherService } from "../../services/pusher.service.interface";
import { IPushSubscriptionRepository } from "../../repositories/push-subscription.repository.interface";
import { IWebPushService } from "../../services/web-push.service.interface";

export class SendMessageUseCase {
  constructor(
    private messageRepository: IMessageRepository,
    private roomRepository: IRoomRepository,
    private pusherService: IPusherService,
    private discordNotifierService: INotifierService,
    private pushSubscriptionRepository: IPushSubscriptionRepository,
    private webPushService: IWebPushService
  ) { }

  async execute(
    userId: string,
    content: string,
    roomId: string,
    replyTo?: string,
    attachments?: { url: string; key: string; fileType: string; size?: number }[],
    optimisticId?: string
  ): Promise<MessageWithUserDTO> {
    const message = await this.messageRepository.createMessage(
      userId,
      content,
      roomId,
      replyTo,
      attachments
    );

    const messageWithOptimisticId = { ...message, optimisticId };

    await this.pusherService.trigger(`chat-${roomId}`, "new-message", messageWithOptimisticId);

    const [roomData, participants] = await Promise.all([
      this.roomRepository.getRoomById(roomId),
      this.roomRepository.getOtherParticipants(roomId, userId),
    ]);
    const userName = message.user.username;

    const receiverIds = participants.map((p) => p.userId);

    await this.pusherService.triggerToUsers(
      receiverIds,
      "new-message-notification",
      {
        message: messageWithOptimisticId,
        senderId: userId,
      }
    );

    const resolveContentForNotification = (raw: string) => {
      return raw.replace(/<@([a-zA-Z0-9_-]+)>/g, (match, uid) => {
        if (uid === "everyone") return "@everyone";
        if (uid === userId) return `@${userName}`;
        const p = participants.find(p => p.userId === uid);
        // We assume p.user.username exists on the returned participants
        return p && (p as any).user?.username ? `@${(p as any).user.username}` : match;
      });
    };

    const notificationContent = resolveContentForNotification(content);

    // Push notifications for offline/background users, asynchronously.
    // One batched query for all receivers instead of a serial round-trip per
    // room member on the critical send path.
    //
    // Each subscription carries its own transport: "web" rows go over VAPID,
    // "fcm" rows over Firebase Cloud Messaging. Both are kept because FCM is
    // delivered by Google Play Services and simply cannot reach devices
    // without it, which is common on Huawei and degoogled ROMs.
    const pushPromises: Promise<void>[] = [];

    const allSubscriptions = await this.pushSubscriptionRepository.getSubscriptionsByUserIds(
      receiverIds
    );

    for (const sub of allSubscriptions) {
      if (sub.type === "fcm") {
        pushPromises.push(
          this.webPushService
            .sendNativeNotification(sub.endpoint, {
              title: userName,
              body: notificationContent,
              url: `/channels/${roomId}`,
            })
            .then(async ({ expired }) => {
              // A rejected token never recovers; drop it so the row does not
              // grow without bound and every send does not retry a dead target.
              if (expired) {
                await this.pushSubscriptionRepository
                  .deleteSubscriptionById(sub.id)
                  .catch(() => {});
              }
            })
        );
        continue;
      }

      if (!sub.p256dh || !sub.auth) continue;

      pushPromises.push(
        this.webPushService.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: userName,
            body: notificationContent,
            url: `/channels/${roomId}`,
          })
        )
      );
    }

    Promise.allSettled(pushPromises).catch(console.error);

    await this.discordNotifierService.sendMessage(
      [
        `@everyone`,
        `**Pesan Baru**`,
        `Pengirim: **${userName ?? userId}**`,
        `Ruangan: **${roomData?.name ?? roomId}**`,
        `Konten:\n> ${notificationContent}`,
      ].join("\n")
    );

    return messageWithOptimisticId;
  }
}
