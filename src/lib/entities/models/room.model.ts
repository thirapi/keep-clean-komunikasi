export interface RoomRecord {
  id: string;
  name: string;
  isDirect: boolean;
  description: string | null;
  avatar: string | null;
  isPublic: boolean;
  ownerId: string | null;
}

export interface RoomWithParticipantsDTO extends RoomRecord {
  participants: {
    lastReadAt: Date | null;
    user: {
      id: string;
      username: string;
      avatar: string | null;
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
