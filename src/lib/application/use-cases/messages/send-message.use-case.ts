// src/lib/application/use-cases/messages/send-message.use-case.ts
import { IMessageRepository } from "../../repositories/message.repository.interface";
import { IPusherService } from "../../services/pusher.service.interface";

export class SendMessageUseCase {
  constructor(
    private messageRepository: IMessageRepository,
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

    try {
      await this.pusherService.trigger(
        `chat-${roomId}`,
        "new-message",
        message
      );
    } catch (err) {
      console.error("Pusher error:", err);
    }
  }
}
