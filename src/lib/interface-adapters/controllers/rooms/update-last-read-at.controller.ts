import { UpdateLastReadAtUseCase } from "@/lib/application/use-cases/rooms/update-last-read-at.use-case";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { prisma } from "@/lib/prisma";

const roomRepository = new RoomRepository(prisma);
const updateLastReadAtUseCase = new UpdateLastReadAtUseCase(roomRepository);

export async function updateLastReadAtController(
  userId: string,
  roomId: string,
  date: Date
): Promise<void> {
  if (!userId || !roomId || !date) {
    throw new Error("Invalid input parameters");
  }

  await updateLastReadAtUseCase.execute(userId, roomId, date);
}
