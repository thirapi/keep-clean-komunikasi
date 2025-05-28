import { IRoomRepository } from "../../repositories/room.repository.interface";

export class UpdateLastReadAtUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(userId: string, roomId: string, date: Date): Promise<void> {
    if (!userId || !roomId || !date) {
      throw new Error("Invalid input parameters");
    }

    await this.roomRepository.updateLastReadAt(userId, roomId, date);
  }
}
