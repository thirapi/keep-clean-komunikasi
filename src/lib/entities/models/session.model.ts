import { UserRecord } from "./user.model";

export interface SessionRecord {
    id: string;
    userId: string;
    expiresAt: Date;
}

export type SessionDTO = {
    session: SessionRecord | null;
    user: Omit<UserRecord, "password"> | null;
};