// src/lib/application/use-cases/messages/send-message.use-case.ts
import { IMessageRepository } from "../../repositories/message.repository.interface";
import { IRoomRepository } from "../../repositories/room.repository.interface";
import { IPusherService } from "../../services/pusher.service.interface";

export class SendMessageUseCase {
  constructor(
    private messageRepository: IMessageRepository,
    private roomRepository: IRoomRepository,
    private pusherService: IPusherService
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
  }
}
