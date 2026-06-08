import { db } from "@/lib/db";
import { messages, attachments as attachmentsTable } from "@/lib/infrastructure/drizzle/schema";
import { eq, asc, desc, lt, gt, and, ilike } from "drizzle-orm";
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
              name: true,
              avatar: true,
              bio: true,
              banner: true,
              customStatus: true,
            },
          },
          replyToMessage: {
            with: {
              user: {
                columns: {
                  username: true,
                  name: true,
                },
              },
            },
          },
          attachments: true,
          reactions: {
            with: {
              user: {
                columns: {
                  username: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return newMessage as unknown as MessageWithUserDTO;
    });
  }

  async getMessagesByRoomId(roomId: string, limit?: number, before?: Date, after?: Date): Promise<MessageWithUserDTO[]> {
    const filters = [eq(messages.roomId, roomId), eq(messages.isDeleted, false)];
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
            name: true,
            avatar: true,
          },
        },
        replyToMessage: {
          with: {
            user: {
              columns: {
                username: true,
                name: true,
              },
            },
          },
        },
        attachments: true,
        reactions: {
          with: {
            user: {
              columns: {
                username: true,
                name: true,
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

  async getMessageById(messageId: string): Promise<MessageWithUserDTO | null> {
    const message = await this.client.query.messages.findFirst({
      where: and(eq(messages.id, messageId), eq(messages.isDeleted, false)),
      with: {
        user: {
          columns: {
            username: true,
            name: true,
            avatar: true,
          },
        },
        replyToMessage: {
          with: {
            user: {
              columns: {
                username: true,
                name: true,
              },
            },
          },
        },
        attachments: true,
        reactions: {
          with: {
            user: {
              columns: {
                username: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return (message as unknown as MessageWithUserDTO) || null;
  }

  async updateMessage(messageId: string, content: string): Promise<MessageWithUserDTO> {
    const updatedMessages = await this.client
      .update(messages)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();

    if (updatedMessages.length === 0) {
      throw new Error("Message not found or update failed");
    }

    const message = await this.getMessageById(messageId);
    if (!message) {
      throw new Error("Failed to retrieve updated message");
    }

    return message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.client.update(messages).set({ isDeleted: true }).where(eq(messages.id, messageId));
  }

  async searchMessages(query: string, roomId?: string, limit: number = 20): Promise<MessageWithUserDTO[]> {
    const filters = [ilike(messages.content, `%${query}%`), eq(messages.isDeleted, false)];
    if (roomId) {
      filters.push(eq(messages.roomId, roomId));
    }

    const results = await this.client.query.messages.findMany({
      where: and(...filters),
      orderBy: [desc(messages.createdAt)],
      limit: limit,
      with: {
        user: {
          columns: {
            username: true,
            name: true,
            avatar: true,
          },
        },
        replyToMessage: {
          with: {
            user: {
              columns: {
                username: true,
                name: true,
              },
            },
          },
        },
        attachments: true,
        reactions: {
          with: {
            user: {
              columns: {
                username: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return results as unknown as MessageWithUserDTO[];
  }
}
