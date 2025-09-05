// src/lib/application/use-cases/messages/send-message.use-case.ts
import { m } from "framer-motion";
import { IMessageRepository } from "../../repositories/message.repository.interface";
import { IRoomRepository } from "../../repositories/room.repository.interface";
import { INotifierService } from "../../services/discord-notifier.service.interface";
import { IPusherService } from "../../services/pusher.service.interface";

export class SendMessageUseCase {
  constructor(
    private messageRepository: IMessageRepository,
    private roomRepository: IRoomRepository,
    private pusherService: IPusherService,
    private discordNotifierService: INotifierService
  ) {}

  async execute(
    userId: string,
    content: string,
    roomId: string,
    imageUrl?: string,
    replyTo?: string
  ): Promise<void> {
    const message = await this.messageRepository.createMessage(
      userId,
      content,
      roomId,
      imageUrl,
      replyTo
    );

    await this.pusherService.trigger(`chat-${roomId}`, "new-message", message);

    const roomName = await this.roomRepository.getRoomById(roomId);
    const userName = message.user.username;

    const participants = await this.roomRepository.getOtherParticipants(
      roomId,
      userId
    );
    const receiverIds = participants.map((p) => p.userId);

    await this.pusherService.triggerToUsers(
      receiverIds,
      "new-message-notification",
      {
        message,
        senderId: userId,
      }
    );

    await this.discordNotifierService.sendMessage(
      [
        `@everyone`,
        `**Pesan Baru**`,
        `Pengirim: **${userName ?? userId}**`,
        `Ruangan: **${roomName?.name ?? roomId}**`,
        `Konten:\n> ${content}`,
      ].join("\n")
    );
  }
}
