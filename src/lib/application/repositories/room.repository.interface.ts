import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";

export interface IRoomRepository {
  getRoomById(roomId: string): Promise<RoomWithParticipantsDTO | null>;
  getAllRoomsByUserId(
    userId: string,
    options?: { isDirect?: boolean }
  ): Promise<RoomWithParticipantsDTO[] | null>;
}
