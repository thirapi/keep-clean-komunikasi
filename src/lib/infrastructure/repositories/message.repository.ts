import { db } from "@/lib/db";
import { messages, attachments as attachmentsTable } from "@/lib/infrastructure/drizzle/schema";
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
    replyTo?: string,
    attachments?: { url: string; key: string; fileType: string; size?: number }[]
  ): Promise<MessageWithUserDTO> {
    const id = createId();
    
    return await this.client.transaction(async (tx) => {
      await tx.insert(messages).values({
        id,
        userId,
        content,
        roomId,
        replyTo,
      });

      if (attachments && attachments.length > 0) {
        await tx.insert(attachmentsTable).values(
          attachments.map((a) => ({
            id: createId(),
            messageId: id,
            url: a.url,
            key: a.key,
            fileType: a.fileType,
            size: a.size,
          }))
        );
      }

      const newMessage = await tx.query.messages.findFirst({
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
          attachments: true,
        },
      });

      return newMessage as unknown as MessageWithUserDTO;
    });
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
        attachments: true,
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
