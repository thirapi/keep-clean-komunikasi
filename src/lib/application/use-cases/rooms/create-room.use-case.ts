import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { IRoomRepository } from "../../repositories/room.repository.interface";

export class CreateRoomUseCase {
  constructor(private roomRepository: IRoomRepository) {}
  async execute(
    name: string,
    isDirect: boolean,
    participantIds: string[],
    avatar: string,
    description?: string,
    isPublic: boolean = false,
    ownerId?: string
  ): Promise<RoomWithParticipantsDTO> {
    return this.roomRepository.createRoom(
      name,
      isDirect,
      participantIds,
      avatar,
      description,
      isPublic,
      ownerId
    );
  }
}
