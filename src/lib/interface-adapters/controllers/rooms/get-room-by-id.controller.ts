import { GetRoomByIdUseCase } from "@/lib/application/use-cases/rooms/get-room-by-id.use-case";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";

import { db } from "@/lib/db";

const roomRepository = new RoomRepository(db);
const getRoomByIdUseCase = new GetRoomByIdUseCase(roomRepository);

export async function getRoomByIdController(roomId: string) {
  return await getRoomByIdUseCase.execute(roomId);
}
