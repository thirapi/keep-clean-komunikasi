import { IRoomRepository } from "../../repositories/room.repository.interface";
import { IUserRepository } from "../../repositories/user.repository.interface";
import { createId } from "@paralleldrive/cuid2";

export class InviteToRoomUseCase {
  constructor(
    private roomRepository: IRoomRepository,
    private userRepository: IUserRepository
  ) {}

  async searchInvitableUsers(
    roomId: string,
    query: string
  ): Promise<{ id: string; username: string; avatar: string | null }[]> {
    const room = await this.roomRepository.getRoomById(roomId);
    if (!room) throw new Error("Channel tidak ditemukan");

    const participantIds = new Set(room.participants.map((p) => p.user.id));

    const users = await this.userRepository.searchUsers(query, 10);

    // Filter out users already in the room
    return users.filter((u) => !participantIds.has(u.id));
  }

  async execute(
    roomId: string,
    requesterId: string,
    targetUserId: string
  ): Promise<void> {
    const room = await this.roomRepository.getRoomById(roomId);
    if (!room) throw new Error("Channel tidak ditemukan");

    // Only owner can invite to private channels
    if (!room.isPublic && room.ownerId !== requesterId) {
      throw new Error("Hanya pemilik channel yang dapat mengundang anggota baru");
    }

    // Check if user is already a member
    const isAlreadyMember = room.participants.some((p) => p.user.id === targetUserId);
    if (isAlreadyMember) {
      throw new Error("User sudah menjadi anggota channel ini");
    }

    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) throw new Error("User tidak ditemukan");

    await this.roomRepository.addParticipant(roomId, targetUserId);
  }
}
