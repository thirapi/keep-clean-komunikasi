export interface UserRecord {
    id: string;
    username: string;
    password: string;
}

export type SignInUserDTO = Pick<UserRecord, "username" | "password">;

export type SignUpUserDTO = Omit<UserRecord, "id"> & {
    confirm_password: string;
};

