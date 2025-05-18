import { PrismaClient } from "@/generated/prisma";
import { IMessageRepository } from "@/lib/application/repositories/message.repository.interface";
import {
  MessageRecord,
  MessageWithUserDTO,
} from "@/lib/entities/models/message.model";

export class MessageRepository implements IMessageRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createMessage(
    userId: string,
    content: string,
    roomId: string,
    imageUrl?: string,
    replyTo?: string
  ): Promise<MessageWithUserDTO> {
    return await this.prisma.message.create({
      data: {
        userId,
        content,
        roomId,
        imageUrl,
        replyTo,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        replyToMessage: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });
  }

  async getMessagesByRoomId(roomId: string): Promise<MessageWithUserDTO[]> {
    const messages = await this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        replyToMessage: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    return messages;
  }
}
