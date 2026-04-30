import { IRoomRepository } from "../../repositories/room.repository.interface";

export class GetLastReadAtUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(userId: string, roomId: string): Promise<string | null> {
    if (!userId || !roomId) {
      throw new Error("Invalid input parameters");
    }

    const lastReadMessageId = await this.roomRepository.getLastReadAt(userId, roomId);
    return lastReadMessageId;
  }
}
