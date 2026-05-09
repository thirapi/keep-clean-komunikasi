import { IRoomRepository } from "../../repositories/room.repository.interface";
import { IPusherService } from "../../services/pusher.service.interface";

export class UpdateLastReadAtUseCase {
  constructor(
    private roomRepository: IRoomRepository,
    private pusherService: IPusherService
  ) {}

  async execute(
    userId: string,
    roomId: string,
    messageId: string,
    lastReadAt?: Date
  ): Promise<void> {
    if (!userId || !roomId || !messageId) {
      throw new Error("Invalid input parameters");
    }

    await this.roomRepository.updateLastReadAt(userId, roomId, messageId, lastReadAt);

    // Broadcast read event to other devices/tabs for the same user
    await this.pusherService.triggerToUsers([userId], "room-marked-read", {
      roomId,
      messageId,
      lastReadAt: lastReadAt ?? new Date(),
    });
  }
}
