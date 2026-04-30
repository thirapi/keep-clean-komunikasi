import { SidebarRoomDTO } from "@/lib/entities/models/room.model";
import { IRoomRepository } from "../../repositories/room.repository.interface";

export class GetSidebarDataUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(userId: string): Promise<{
    channels: SidebarRoomDTO[];
    directMessages: SidebarRoomDTO[];
  }> {
    const rooms = await this.roomRepository.getAllRoomsByUserId(userId);
    const roomsToFormat = rooms ?? [];

    const formattedRooms: SidebarRoomDTO[] = roomsToFormat.map((room) => {
      const currentUserParticipant = room.participants.find(
        (participant) => participant.user.id === userId
      );

      const lastReadAt = currentUserParticipant?.lastReadAt
        ? new Date(currentUserParticipant.lastReadAt)
        : null;

      const latestMessageAt = room.messages[0]?.createdAt
        ? new Date(room.messages[0].createdAt)
        : null;

      const hasUnread = Boolean(
        latestMessageAt && (!lastReadAt || latestMessageAt > lastReadAt)
      );

      if (room.isDirect) {
        // Find other participant, fallback to self for DM with self
        const otherParticipant = room.participants.find(
          (participant) => participant.user.id !== userId
        ) || room.participants.find(
          (participant) => participant.user.id === userId
        );

        return {
          id: room.id,
          userId: otherParticipant?.user.id || userId,
          name: otherParticipant?.user.username || "unknown",
          avatar: otherParticipant?.user.avatar || "/avatars/avatar1.png",
          url: `/channels/${room.id}`,
          hasUnread,
          type: "direct" as const,
        };
      }

      return {
        id: room.id,
        name: room.name,
        url: `/channels/${room.id}`,
        avatar: room.avatar,
        hasUnread,
        type: "channel" as const,
      };
    });

    return {
      channels: formattedRooms.filter((r) => r.type === "channel"),
      directMessages: formattedRooms.filter((r) => r.type === "direct"),
    };
  }
}
