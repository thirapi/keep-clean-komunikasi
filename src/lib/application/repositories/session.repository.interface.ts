import { SessionDTO, SessionLogRecord, SessionRecord } from "@/lib/entities/models/session.model";

export interface ISessionRepository {
    getAllSessions(limit?: number): Promise<SessionLogRecord[]>;
    findBySessionId(sessionId: string): Promise<SessionRecord | null>;
    insertSession(sessionData: SessionRecord): Promise<boolean>;
    deleteSession(sessionId: string): Promise<void>;
    updateSession(sessionData: SessionRecord): Promise<void>;
}
