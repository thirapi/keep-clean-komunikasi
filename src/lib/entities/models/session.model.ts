import { UserRecord } from "./user.model";

export interface SessionRecord {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
}

export type SessionDTO = {
    session: SessionRecord | null;
    user: Omit<UserRecord, "password"> | null;
};

export type SessionLogRecord = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  user: Omit<UserRecord, "password">;
};