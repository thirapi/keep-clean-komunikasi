import { ToggleReactionUseCase } from "@/lib/application/use-cases/messages/toggle-reaction.use-case";
import { ReactionRepository } from "@/lib/infrastructure/repositories/reaction.repository";
import { MessageRepository } from "@/lib/infrastructure/repositories/message.repository";
import { PusherService } from "@/lib/infrastructure/services/pusher.service";
import { db } from "@/lib/db";

const reactionRepository = new ReactionRepository(db);
const messageRepository = new MessageRepository(db);
const pusherService = new PusherService();

const toggleReactionUseCase = new ToggleReactionUseCase(
  reactionRepository,
  messageRepository,
  pusherService
);

export const toggleReactionController = async (userId: string, messageId: string, emoji: string) => {
  return await toggleReactionUseCase.execute(userId, messageId, emoji);
};
