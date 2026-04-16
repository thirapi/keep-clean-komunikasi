import { RemoveParticipantUseCase } from "@/lib/application/use-cases/rooms/remove-participant.use-case";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { db } from "@/lib/db";

const roomRepository = new RoomRepository(db);
const removeParticipantUseCase = new RemoveParticipantUseCase(roomRepository);

export const removeParticipantController = async (roomId: string, userId: string, requesterId: string) => {
  return await removeParticipantUseCase.execute(roomId, userId, requesterId);
};
