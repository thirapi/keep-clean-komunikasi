import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";

export interface IRoomRepository {
  getRoomById(roomId: string): Promise<RoomWithParticipantsDTO | null>;
  getAllRoomsByUserId(
    userId: string,
    options?: { isDirect?: boolean }
  ): Promise<RoomWithParticipantsDTO[] | null>;
  updateLastReadAt(userId: string, roomId: string, date: Date): Promise<void>;
  getLastReadAt(userId: string, roomId: string): Promise<Date | null>;
}
