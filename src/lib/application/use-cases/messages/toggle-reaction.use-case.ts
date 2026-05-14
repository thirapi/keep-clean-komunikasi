import { IReactionRepository } from "../../repositories/reaction.repository.interface";
import { IMessageRepository } from "../../repositories/message.repository.interface";
import { IPusherService } from "../../services/pusher.service.interface";

export class ToggleReactionUseCase {
  constructor(
    private reactionRepository: IReactionRepository,
    private messageRepository: IMessageRepository,
    private pusherService: IPusherService
  ) {}

  async execute(userId: string, messageId: string, emoji: string) {
    const message = await this.messageRepository.getMessageById(messageId);
    if (!message) throw new Error("Pesan tidak ditemukan");

    const result = await this.reactionRepository.toggleReaction(userId, messageId, emoji);

    // Broadcast realtime event
    await this.pusherService.trigger(`chat-${message.roomId}`, "message-reaction", {
      messageId,
      userId,
      emoji,
      action: result.action,
      reaction: result.reaction
    });

    return result;
  }
}
