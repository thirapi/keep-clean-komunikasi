import { UpdateRoomUseCase } from "@/lib/application/use-cases/rooms/update-room.use-case";
import { DeleteRoomUseCase } from "@/lib/application/use-cases/rooms/delete-room.use-case";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { db } from "@/lib/db";

const roomRepository = new RoomRepository(db);
const updateRoomUseCase = new UpdateRoomUseCase(roomRepository);
const deleteRoomUseCase = new DeleteRoomUseCase(roomRepository);

export const updateRoomController = async (
  roomId: string,
  requesterId: string,
  data: { name?: string; description?: string; isPublic?: boolean }
) => {
  return await updateRoomUseCase.execute(roomId, requesterId, data);
};

export const deleteRoomController = async (roomId: string, requesterId: string) => {
  return await deleteRoomUseCase.execute(roomId, requesterId);
};
