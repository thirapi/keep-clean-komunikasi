import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { IRoomRepository } from "../../repositories/room.repository.interface";

export class GetPublicRoomsUseCase {
  constructor(private roomRepository: IRoomRepository) {}
  async execute(userId: string): Promise<RoomWithParticipantsDTO[]> {
    return this.roomRepository.getPublicRooms(userId);
  }
}
