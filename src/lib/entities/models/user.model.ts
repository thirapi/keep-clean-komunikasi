export interface UserRecord {
  id: string;
  username: string;
  password: string;
  avatar: string | null;
}

export type SignInUserDTO = Pick<UserRecord, "username" | "password">;

export type SignUpUserDTO = Omit<UserRecord, "id" | "avatar"> & {
  avatar?: string | null;
  confirm_password: string;
};
