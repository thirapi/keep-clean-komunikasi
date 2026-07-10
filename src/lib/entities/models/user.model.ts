export interface UserRecord {
  id: string;
  username: string;
  name?: string | null;
  password: string;
  avatar: string;
  bio?: string | null;
  banner?: string | null;
  customStatus?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SignInUserDTO = Pick<UserRecord, "username" | "password">;

export type SignUpUserDTO = Omit<UserRecord, "id" | "avatar" | "createdAt" | "updatedAt"> & {
  name?: string | null;
  avatar?: string | null;
  confirm_password: string;
};
