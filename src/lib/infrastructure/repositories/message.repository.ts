import { db } from "@/lib/db";
import { messages, users } from "@/lib/infrastructure/drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { IMessageRepository } from "@/lib/application/repositories/message.repository.interface";
import {
  MessageRecord,
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

  async getMessagesByRoomId(roomId: string): Promise<MessageWithUserDTO[]> {
    const allMessages = await this.client.query.messages.findMany({
      where: eq(messages.roomId, roomId),
      orderBy: [asc(messages.createdAt)],
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

    return allMessages as unknown as MessageWithUserDTO[];
  }
}
