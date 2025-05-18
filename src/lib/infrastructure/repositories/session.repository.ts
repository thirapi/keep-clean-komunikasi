import { ISessionRepository } from "@/lib/application/repositories/session.repository.interface";
import { SessionRecord } from "@/lib/entities/models/session.model";
import { PrismaClient } from "@/generated/prisma/client";

export class SessionRepository implements ISessionRepository {
  constructor(private prisma: PrismaClient) {}

  async insertSession(sessionData: SessionRecord): Promise<boolean> {
    try {
      await this.prisma.session.create({
        data: sessionData,
      });
      return true;
    } catch (err) {
      return false;
    }
  }
  async deleteSession(sessionId: string): Promise<void> {
    await this.prisma.session.delete({
      where: {
        id: sessionId,
      },
    });
  }
  async findBySessionId(sessionId: string): Promise<SessionRecord | null> {
    try {
      return await this.prisma.session.findUnique({
        where: {
          id: sessionId,
        },
      });
    } catch (err) {
      return null;
    }
  }
  async updateSession(sessionData: SessionRecord): Promise<void> {
    await this.prisma.session.update({
      where: {
        id: sessionData.id,
      },
      data: sessionData,
    });
  }
}
