import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { IRoomRepository } from "../../repositories/room.repository.interface";

export class GetRoomByUserIdUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(
    userId: string,
    options?: { isDirect?: boolean }
  ): Promise<RoomWithParticipantsDTO[]> {
    const rooms = await this.roomRepository.getAllRoomsByUserId(userId, options);

    if (!rooms) {
      throw new Error("Rooms not found");
    }

    return rooms;
  }
}
