import { IRoomRepository } from "../../repositories/room.repository.interface";

export class JoinRoomUseCase {
  constructor(private roomRepository: IRoomRepository) {}
  async execute(roomId: string, userId: string): Promise<void> {
    // Check if room is public or has permission (for now we assume it's allowed if user can see it in discovery)
    await this.roomRepository.addParticipant(roomId, userId);
  }
}
