export interface RoomRecord {
  id: string;
  name: string;
  isDirect: boolean;
  description: string | null;
  avatar: string;
  isPublic: boolean;
  ownerId: string | null;
}

export interface SidebarRoomDTO {
  id: string;
  name: string;
  url: string;
  avatar: string;
  hasUnread: boolean;
  type: "channel" | "direct";
  userId?: string;
}

export interface RoomWithParticipantsDTO extends RoomRecord {
  participants: {
    lastReadAt: Date | null;
    user: {
      id: string;
      username: string;
      avatar: string;
      userRoles: {
        role: {
          name: string;
        };
      }[];
    };
  }[];
  messages: {
    id: string;
    content: string;
    createdAt: Date;
  }[];
}
