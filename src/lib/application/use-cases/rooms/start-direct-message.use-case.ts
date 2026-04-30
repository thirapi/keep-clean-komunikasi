import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { IRoomRepository } from "../../repositories/room.repository.interface";
import { avatarService } from "@/lib/infrastructure/services/avatar.service";

export class StartDirectMessageUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(
    currentUserId: string,
    targetUserId: string
  ): Promise<{ room: RoomWithParticipantsDTO; action: "existing" | "created" }> {
    const existingRooms = await this.roomRepository.getAllRoomsByUserId(currentUserId, {
      isDirect: true,
    });

    const existingRoom = existingRooms?.find((room) =>
      room.participants.some((p) => p.user.id === targetUserId)
    );

    if (existingRoom) {
      return {
        room: existingRoom,
        action: "existing",
      };
    }

    const avatar = avatarService.generateAvatarUrl(`${currentUserId}-${targetUserId}`);

    const newRoom = await this.roomRepository.createRoom(
      `${currentUserId}-${targetUserId}`,
      true,
      [currentUserId, targetUserId],
      avatar,
      undefined,
      false
    );

    return {
      room: newRoom,
      action: "created",
    };
  }
}
