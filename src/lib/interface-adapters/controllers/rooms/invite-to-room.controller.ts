import { InviteToRoomUseCase } from "@/lib/application/use-cases/rooms/invite-to-room.use-case";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { db } from "@/lib/db";

const roomRepository = new RoomRepository(db);
const userRepository = new UserRepository(db);
const inviteToRoomUseCase = new InviteToRoomUseCase(roomRepository, userRepository);

export const searchInvitableUsersController = async (
  roomId: string,
  query: string
): Promise<{ id: string; username: string; avatar: string | null }[]> => {
  return inviteToRoomUseCase.searchInvitableUsers(roomId, query);
};

export const inviteToRoomController = async (
  roomId: string,
  requesterId: string,
  targetUserId: string
): Promise<void> => {
  return inviteToRoomUseCase.execute(roomId, requesterId, targetUserId);
};
