import { JoinRoomUseCase } from "@/lib/application/use-cases/rooms/join-room.use-case";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { db } from "@/lib/db";

const roomRepository = new RoomRepository(db);
const joinRoomUseCase = new JoinRoomUseCase(roomRepository);

export const joinRoomController = async (roomId: string, userId: string) => {
  return await joinRoomUseCase.execute(roomId, userId);
};
