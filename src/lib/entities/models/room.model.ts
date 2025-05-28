export interface RoomRecord {
  id: string;
  name: string;
  isDirect: boolean;
}

export interface RoomWithParticipantsDTO extends RoomRecord {
  participants: {
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
}
