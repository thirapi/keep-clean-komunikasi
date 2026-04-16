import { GetPublicRoomsUseCase } from "@/lib/application/use-cases/rooms/get-public-rooms.use-case";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { db } from "@/lib/db";

const roomRepository = new RoomRepository(db);
const getPublicRoomsUseCase = new GetPublicRoomsUseCase(roomRepository);

export const getPublicRoomsController = async (userId: string) => {
  return await getPublicRoomsUseCase.execute(userId);
};
