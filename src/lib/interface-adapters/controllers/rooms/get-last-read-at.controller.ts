import { GetLastReadAtUseCase } from "@/lib/application/use-cases/rooms/get-last-read-at.use-case";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { prisma } from "@/lib/prisma";

const roomRepository = new RoomRepository(prisma);
const getLastReadAtUseCase = new GetLastReadAtUseCase(roomRepository);

export async function getLastReadAtController(
  userId: string,
  roomId: string
): Promise<Date | null> {
  return await getLastReadAtUseCase.execute(userId, roomId);
}
