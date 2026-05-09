import { IRoomRepository } from "../../repositories/room.repository.interface";

export class GetLastReadAtUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(userId: string, roomId: string): Promise<{ id: string | null; at: Date | null }> {
    if (!userId || !roomId) {
      throw new Error("Invalid input parameters");
    }

    return await this.roomRepository.getLastReadAt(userId, roomId);
  }
}
