import { SessionRecord } from "@/lib/entities/models/session.model";

export interface ISessionRepository {
    findBySessionId(sessionId: string): Promise<SessionRecord | null>;
    insertSession(sessionData: SessionRecord): Promise<boolean>;
    deleteSession(sessionId: string): Promise<void>;
    updateSession(sessionData: SessionRecord): Promise<void>;
}
