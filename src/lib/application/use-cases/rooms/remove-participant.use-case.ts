import { IRoomRepository } from "../../repositories/room.repository.interface";

export class RemoveParticipantUseCase {
  constructor(private roomRepository: IRoomRepository) {}
  async execute(roomId: string, userId: string, requesterId: string): Promise<void> {
    const room = await this.roomRepository.getRoomById(roomId);
    if (!room) throw new Error("Room not found");

    // Only owner can kick (unless requester is kicking themselves, i.e., Leave Room)
    if (room.ownerId !== requesterId && userId !== requesterId) {
      throw new Error("Unauthorized to perform this action");
    }

    // Cannot kick the owner
    if (userId === room.ownerId && userId !== requesterId) {
       throw new Error("Cannot kick the owner of the channel");
    }

    // Don't allow leaving general-channel if it is mandatory (optional logic)
    if (roomId === "general-channel" && userId === requesterId) {
        // Maybe allow, but usually General is mandatory. Let's allow for now but add a comment.
    }

    await this.roomRepository.removeParticipant(roomId, userId);
  }
}
