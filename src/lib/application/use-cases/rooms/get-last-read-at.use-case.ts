import { IRoomRepository } from "../../repositories/room.repository.interface";

export class GetLastReadAtUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(userId: string, roomId: string): Promise<Date | null> {
    if (!userId || !roomId) {
      throw new Error("Invalid input parameters");
    }

    const lastReadAt = await this.roomRepository.getLastReadAt(userId, roomId);
    return lastReadAt;
  }
}
