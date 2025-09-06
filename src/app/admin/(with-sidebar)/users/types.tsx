export interface AllUsers {
    id: string;
    username: string;
    avatar: string | null;
    roles: { id: string; name: string }[];
  }