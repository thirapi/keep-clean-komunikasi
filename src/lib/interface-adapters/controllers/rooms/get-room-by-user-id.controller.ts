import { GetRoomByUserIdUseCase } from "@/lib/application/use-cases/rooms/get-room-by-user-id.use-case";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";

const roomRepository = new RoomRepository();
const getRoomByUserIdUseCase = new GetRoomByUserIdUseCase(roomRepository);

export async function getRoomByUserIdController(userId: string) {
  return await getRoomByUserIdUseCase.execute(userId);
}