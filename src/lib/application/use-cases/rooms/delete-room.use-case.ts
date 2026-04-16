import { IRoomRepository } from "../../repositories/room.repository.interface";

export class DeleteRoomUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(roomId: string, requesterId: string): Promise<void> {
    const room = await this.roomRepository.getRoomById(roomId);
    if (!room) throw new Error("Channel tidak ditemukan");

    if (room.ownerId !== requesterId) {
      throw new Error("Hanya pemilik channel yang dapat menghapus channel ini");
    }

    // Prevent deleting the 'general' channel
    if (roomId === "general-channel") {
      throw new Error("Channel general tidak dapat dihapus");
    }

    await this.roomRepository.deleteRoom(roomId);
  }
}
