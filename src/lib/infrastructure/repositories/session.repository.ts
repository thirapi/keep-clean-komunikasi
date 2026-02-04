import { db } from "@/lib/db";
import { sessions } from "@/lib/infrastructure/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { ISessionRepository } from "@/lib/application/repositories/session.repository.interface";
import { SessionLogRecord, SessionRecord } from "@/lib/entities/models/session.model";

export class SessionRepository implements ISessionRepository {
  constructor(private client: typeof db) { }

  async getAllSessions(): Promise<SessionLogRecord[]> {
    const allSessions = await this.client.query.sessions.findMany({
      orderBy: [desc(sessions.createdAt)],
      with: {
        user: true,
      },
    });
    return allSessions as unknown as SessionLogRecord[];
  }

  async insertSession(sessionData: SessionRecord): Promise<boolean> {
    try {
      await this.client.insert(sessions).values(sessionData);
      return true;
    } catch (err) {
      console.error("Error inserting session:", err);
      return false;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.delete(sessions).where(eq(sessions.id, sessionId));
  }

  async findBySessionId(sessionId: string): Promise<SessionRecord | null> {
    try {
      const session = await this.client.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
      });
      return session as SessionRecord | null;
    } catch (err) {
      return null;
    }
  }

  async updateSession(sessionData: SessionRecord): Promise<void> {
    await this.client
      .update(sessions)
      .set(sessionData)
      .where(eq(sessions.id, sessionData.id));
  }
}
