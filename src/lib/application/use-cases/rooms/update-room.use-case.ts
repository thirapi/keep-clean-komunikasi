import { IRoomRepository } from "../../repositories/room.repository.interface";

export class UpdateRoomUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(
    roomId: string,
    requesterId: string,
    data: { name?: string; description?: string; isPublic?: boolean; avatar?: string }
  ): Promise<void> {
    const room = await this.roomRepository.getRoomById(roomId);
    if (!room) throw new Error("Channel tidak ditemukan");

    if (room.ownerId !== requesterId) {
      throw new Error("Hanya pemilik channel yang dapat mengubah pengaturan ini");
    }

    if (!data.name && data.description === undefined && data.isPublic === undefined && !data.avatar) {
      throw new Error("Tidak ada perubahan yang dikirim");
    }

    await this.roomRepository.updateRoom(roomId, data);
  }
}
