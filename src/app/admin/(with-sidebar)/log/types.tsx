export interface AdminUserTable {
    id: string;
    username: string;
    roles: { id: string; name: string }[];
  }