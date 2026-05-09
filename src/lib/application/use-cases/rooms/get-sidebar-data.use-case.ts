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

      const latestMessage = room.messages[0];

      // A room has unread if:
      // 1. There is at least one message.
      // 2. The latest message is NOT from the current user.
      // 3. The latest message timestamp is newer than lastReadAt.
      const lastReadTime = currentUserParticipant?.lastReadAt 
        ? new Date(currentUserParticipant.lastReadAt).getTime() 
        : 0;
        
      const hasUnread = Boolean(
        latestMessage && 
        latestMessage.userId !== userId &&
        new Date(latestMessage.createdAt).getTime() > lastReadTime
      );

      // Determine display text for last message
      let lastMessageDisplay = latestMessage?.content;

      if (latestMessage && !latestMessage.content && latestMessage.attachments && latestMessage.attachments.length > 0) {
        const firstAttachment = latestMessage.attachments[0];
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const isImage = imageExtensions.some(ext => firstAttachment.url?.toLowerCase().includes(ext)) || firstAttachment.fileType.startsWith('image/');
        lastMessageDisplay = isImage ? "📷 Foto" : "📁 File";
      }

      if (room.isDirect) {

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
          lastMessage: lastMessageDisplay,
          lastMessageTime: latestMessage?.createdAt,
        };
      }

      return {
        id: room.id,
        name: room.name,
        url: `/channels/${room.id}`,
        avatar: room.avatar,
        hasUnread,
        type: "channel" as const,
        lastMessage: lastMessageDisplay,
        lastMessageTime: latestMessage?.createdAt,
      };
    });

    return {
      channels: formattedRooms.filter((r) => r.type === "channel"),
      directMessages: formattedRooms.filter((r) => r.type === "direct"),
    };
  }
}
