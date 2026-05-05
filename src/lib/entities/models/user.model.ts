export interface UserRecord {
  id: string;
  username: string;
  password: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SignInUserDTO = Pick<UserRecord, "username" | "password">;

export type SignUpUserDTO = Omit<UserRecord, "id" | "avatar" | "createdAt" | "updatedAt"> & {
  avatar?: string | null;
  confirm_password: string;
};
