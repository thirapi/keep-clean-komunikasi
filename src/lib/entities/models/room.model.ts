import { AttachmentRecord } from "./attachment.model";

export interface RoomRecord {
  id: string;
  name: string;
  isDirect: boolean;
  description: string | null;
  avatar: string;
  isPublic: boolean;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SidebarRoomDTO {
  id: string;
  name: string;
  url: string;
  avatar: string;
  hasUnread: boolean;
  type: "channel" | "direct";
  userId?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
}

export interface RoomWithParticipantsDTO extends RoomRecord {
  createdAt: Date;
  updatedAt: Date;
  participants: {
    lastReadMessageId: string | null;
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
    updatedAt: Date;
    attachments?: AttachmentRecord[];
    isDeleted?: boolean;
  }[];
}
