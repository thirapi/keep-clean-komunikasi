import { GetSidebarDataUseCase } from "@/lib/application/use-cases/rooms/get-sidebar-data.use-case";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { db } from "@/lib/db";

const roomRepository = new RoomRepository(db);
const getSidebarDataUseCase = new GetSidebarDataUseCase(roomRepository);

export const getSidebarDataController = async (userId: string) => {
  return await getSidebarDataUseCase.execute(userId);
}
