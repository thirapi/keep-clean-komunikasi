import { db } from "@/lib/db";
import { messages } from "@/lib/infrastructure/drizzle/schema";
import { eq, asc, desc, lt, gt, and } from "drizzle-orm";
import { IMessageRepository } from "@/lib/application/repositories/message.repository.interface";
import {
  MessageWithUserDTO,
} from "@/lib/entities/models/message.model";
import { createId } from "@paralleldrive/cuid2";

export class MessageRepository implements IMessageRepository {
  constructor(private client: typeof db) { }

  async createMessage(
    userId: string,
    content: string,
    roomId: string,
    imageUrl?: string,
    replyTo?: string
  ): Promise<MessageWithUserDTO> {
    const id = createId();
    await this.client.insert(messages).values({
      id,
      userId,
      content,
      roomId,
      imageUrl,
      replyTo,
    });

    const newMessage = await this.client.query.messages.findFirst({
      where: eq(messages.id, id),
      with: {
        user: {
          columns: {
            username: true,
            avatar: true,
          },
        },
        replyToMessage: {
          with: {
            user: {
              columns: {
                username: true,
              },
            },
          },
        },
      },
    });

    return newMessage as unknown as MessageWithUserDTO;
  }

  async getMessagesByRoomId(roomId: string, limit?: number, before?: Date, after?: Date): Promise<MessageWithUserDTO[]> {
    const filters = [eq(messages.roomId, roomId)];
    if (before) {
      filters.push(lt(messages.createdAt, before));
    }
    if (after) {
      filters.push(gt(messages.createdAt, after));
    }

    const allMessages = await this.client.query.messages.findMany({
      where: and(...filters),
      orderBy: [limit ? desc(messages.createdAt) : asc(messages.createdAt)],
      limit: limit,
      with: {
        user: {
          columns: {
            username: true,
            avatar: true,
          },
        },
        replyToMessage: {
          with: {
            user: {
              columns: {
                username: true,
              },
            },
          },
        },
      },
    });

    const result = allMessages as unknown as MessageWithUserDTO[];

    // If we limit (getting latest), we should sort them back to ascending for the UI
    if (limit) {
      return result.reverse();
    }

    return result;
  }
}
