import { UpdateLastReadAtUseCase } from "@/lib/application/use-cases/rooms/update-last-read-at.use-case";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { db } from "@/lib/db";

const roomRepository = new RoomRepository(db);
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
