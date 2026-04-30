export interface AllUsers {
    id: string;
    username: string;
    avatar: string;
    roles: { id: string; name: string }[];
  }