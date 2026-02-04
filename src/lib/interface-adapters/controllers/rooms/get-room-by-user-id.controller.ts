import { GetRoomByUserIdUseCase } from "@/lib/application/use-cases/rooms/get-room-by-user-id.use-case";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";

import { db } from "@/lib/db";

const roomRepository = new RoomRepository(db);
const getRoomByUserIdUseCase = new GetRoomByUserIdUseCase(roomRepository);

export async function getRoomByUserIdController(userId: string, options?: { isDirect?: boolean }) {
  return await getRoomByUserIdUseCase.execute(userId, options);
}