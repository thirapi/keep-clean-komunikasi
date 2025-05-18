import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { IRoomRepository } from "../../repositories/room.repository.interface";

export class GetRoomByIdUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(roomId: string): Promise<RoomWithParticipantsDTO | null> {
    const room = await this.roomRepository.getRoomById(roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    return room;
  }
}
