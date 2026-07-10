import { db } from "@/lib/db";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { MessageRepository } from "@/lib/infrastructure/repositories/message.repository";
import { GetSharedMediaUseCase } from "@/lib/application/use-cases/users/get-shared-media.use-case";

export const getSharedMediaController = async (currentUserId: string, profileUsername: string) => {
  const userRepository = new UserRepository(db);
  const roomRepository = new RoomRepository(db);
  const messageRepository = new MessageRepository(db);
  const getSharedMediaUseCase = new GetSharedMediaUseCase(messageRepository, roomRepository, userRepository);

  return await getSharedMediaUseCase.execute(currentUserId, profileUsername);
};
