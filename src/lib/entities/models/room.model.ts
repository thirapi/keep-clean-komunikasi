export interface RoomRecord {
  id: string;
  name: string;
  isDirect: boolean;
}

export interface RoomWithParticipantsDTO extends RoomRecord {
  participants: {
    lastReadAt: Date | null;
    user: {
      id: string;
      username: string;
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
