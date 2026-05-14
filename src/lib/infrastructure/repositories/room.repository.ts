import { db } from "@/lib/db";
import { rooms, roomParticipants, messages, users, userRoles, roles as rolesTable } from "@/lib/infrastructure/drizzle/schema";
import { eq, and, asc, desc, not, sql, exists, inArray } from "drizzle-orm";
import { IRoomRepository } from "@/lib/application/repositories/room.repository.interface";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { createId } from "@paralleldrive/cuid2";
import { avatarService } from "@/lib/infrastructure/services/avatar.service";

export class RoomRepository implements IRoomRepository {
  constructor(private client: typeof db) { }

  async getRoomById(roomId: string): Promise<RoomWithParticipantsDTO | null> {
    const room = await this.client.query.rooms.findFirst({
      where: (rooms, { eq }) => eq(rooms.id, roomId),
      with: {
        participants: {
          with: {
            user: {
              with: {
                userRoles: {
                  with: {
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!room) {
      return null;
    }

    return {
      id: room.id,
      name: room.name,
      isDirect: room.isDirect,
      description: room.description ?? null,
      avatar: room.avatar,
      isPublic: room.isPublic,
      ownerId: room.ownerId,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      participants: room.participants.map((p) => ({
        lastReadMessageId: p.lastReadMessageId,
        lastReadAt: p.lastReadAt,
        user: {
          id: p.user.id,
          username: p.user.username,
          avatar: p.user.avatar,
          bio: p.user.bio,
          banner: p.user.banner,
          customStatus: p.user.customStatus,
          createdAt: p.user.createdAt,
          userRoles: p.user.userRoles.map((ur) => ({
            role: { name: ur.role.name },
          })),
        },
      })),
      messages: [],
    } as RoomWithParticipantsDTO;
  }

  async getAllRoomsByUserId(
    userId: string,
    options?: { isDirect?: boolean }
  ): Promise<RoomWithParticipantsDTO[]> {
    const participantRooms = await this.client
      .select({ roomId: roomParticipants.roomId })
      .from(roomParticipants)
      .where(eq(roomParticipants.userId, userId));

    const roomIds = participantRooms.map(p => p.roomId);

    if (roomIds.length === 0) {
      return [];
    }

    const conditions = [inArray(rooms.id, roomIds)];
    if (typeof options?.isDirect === "boolean") {
      conditions.push(eq(rooms.isDirect, options.isDirect));
    }

    const allRooms = await this.client.query.rooms.findMany({
      where: and(...conditions),
      orderBy: [asc(rooms.name)],
      with: {
        participants: {
          with: {
            user: {
              with: {
                userRoles: {
                  with: {
                    role: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          where: eq(messages.isDeleted, false),
          limit: 1,
          orderBy: [desc(messages.createdAt)],
          columns: {
            id: true,
            content: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            isDeleted: true,
          },
          with: {
            attachments: true,
          },
        },
      },
    });

    const dtoRooms = allRooms.map((room) => ({
      id: room.id,
      name: room.name,
      isDirect: room.isDirect,
      description: room.description ?? null,
      avatar: room.avatar,
      isPublic: room.isPublic,
      ownerId: room.ownerId,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      participants: room.participants.map((p) => ({
        lastReadMessageId: p.lastReadMessageId,
        lastReadAt: p.lastReadAt,
        user: {
          id: p.user.id,
          username: p.user.username,
          avatar: p.user.avatar,
          bio: p.user.bio,
          banner: p.user.banner,
          customStatus: p.user.customStatus,
          createdAt: p.user.createdAt,
          userRoles: p.user.userRoles.map((ur) => ({
            role: { name: ur.role.name },
          })),
        },
      })),
      messages: room.messages as any[],
    } as RoomWithParticipantsDTO));

    return dtoRooms.sort((a, b) => {
      const aTime = a.messages[0]?.createdAt
        ? new Date(a.messages[0].createdAt).getTime()
        : 0;
      const bTime = b.messages[0]?.createdAt
        ? new Date(b.messages[0].createdAt).getTime()
        : 0;
      return bTime - aTime;
    });
  }

  async updateLastReadAt(
    userId: string,
    roomId: string,
    messageId: string,
    lastReadAt?: Date
  ): Promise<void> {
    await this.client
      .update(roomParticipants)
      .set({
        lastReadMessageId: messageId,
        lastReadAt: lastReadAt ?? new Date()
      })
      .where(
        and(
          eq(roomParticipants.roomId, roomId),
          eq(roomParticipants.userId, userId)
        )
      );
  }

  async getLastReadAt(userId: string, roomId: string): Promise<{ id: string | null; at: Date | null }> {
    const participant = await this.client.query.roomParticipants.findFirst({
      where: and(
        eq(roomParticipants.roomId, roomId),
        eq(roomParticipants.userId, userId)
      ),
      columns: {
        lastReadMessageId: true,
        lastReadAt: true,
      },
    });

    return {
      id: participant?.lastReadMessageId ?? null,
      at: participant?.lastReadAt ?? null,
    };
  }

  async getOtherParticipants(
    roomId: string,
    excludeUserId: string
  ): Promise<{ userId: string }[]> {
    const others = await this.client.query.roomParticipants.findMany({
      where: and(
        eq(roomParticipants.roomId, roomId),
        not(eq(roomParticipants.userId, excludeUserId))
      ),
      columns: {
        userId: true,
      },
    });

    return others;
  }

  async createRoom(
    name: string,
    isDirect: boolean,
    participantIds: string[],
    avatar: string,
    description?: string,
    isPublic: boolean = false,
    ownerId?: string
  ): Promise<RoomWithParticipantsDTO> {
    const roomId = createId();

    return await this.client.transaction(async (tx) => {
      await tx.insert(rooms).values({
        id: roomId,
        name,
        isDirect,
        description,
        avatar,
        isPublic,
        ownerId,
      });

      const participantValues = participantIds.map((userId) => ({
        id: createId(),
        roomId,
        userId,
      }));

      await tx.insert(roomParticipants).values(participantValues);

      const newRoom = await tx.query.rooms.findFirst({
        where: eq(rooms.id, roomId),
        with: {
          participants: {
            with: {
              user: {
                with: {
                  userRoles: {
                    with: {
                      role: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!newRoom) throw new Error("Failed to retrieve newly created room");

      return {
        id: newRoom.id,
        name: newRoom.name,
        isDirect: newRoom.isDirect,
        description: newRoom.description ?? null,
        avatar: newRoom.avatar || avatarService.generateAvatarUrl(newRoom.name),
        isPublic: newRoom.isPublic,
        ownerId: newRoom.ownerId,
        createdAt: newRoom.createdAt,
        updatedAt: newRoom.updatedAt,
        participants: newRoom.participants.map((p) => ({
          lastReadMessageId: p.lastReadMessageId,
          lastReadAt: p.lastReadAt,
          user: {
            id: p.user.id,
            username: p.user.username,
            avatar: p.user.avatar,
            bio: p.user.bio,
            banner: p.user.banner,
            customStatus: p.user.customStatus,
            createdAt: p.user.createdAt,
            userRoles: p.user.userRoles.map((ur) => ({
              role: { name: ur.role.name },
            })),
          },
        })),
        messages: [],
      } as RoomWithParticipantsDTO;
    });
  }

  async getPublicRooms(excludeUserId: string): Promise<RoomWithParticipantsDTO[]> {
    const joinedRoomIds = await this.client
      .select({ roomId: roomParticipants.roomId })
      .from(roomParticipants)
      .where(eq(roomParticipants.userId, excludeUserId));

    const joinedIds = joinedRoomIds.map(p => p.roomId);

    const publicRooms = await this.client.query.rooms.findMany({
      where: joinedIds.length > 0
        ? and(eq(rooms.isPublic, true), not(inArray(rooms.id, joinedIds)))
        : eq(rooms.isPublic, true),
      with: {
        participants: {
          with: {
            user: {
              with: {
                userRoles: {
                  with: {
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return publicRooms.map(room => ({
      id: room.id,
      name: room.name,
      isDirect: room.isDirect,
      description: room.description ?? null,
      avatar: room.avatar,
      isPublic: room.isPublic,
      ownerId: room.ownerId,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      participants: room.participants.map((p) => ({
        lastReadMessageId: p.lastReadMessageId,
        lastReadAt: p.lastReadAt,
        user: {
          id: p.user.id,
          username: p.user.username,
          avatar: p.user.avatar,
          bio: p.user.bio,
          banner: p.user.banner,
          customStatus: p.user.customStatus,
          createdAt: p.user.createdAt,
          userRoles: p.user.userRoles.map((ur) => ({
            role: { name: ur.role.name },
          })),
        },
      })),
      messages: [],
    } as RoomWithParticipantsDTO));
  }

  async addParticipant(roomId: string, userId: string): Promise<void> {
    await this.client.insert(roomParticipants).values({
      id: createId(),
      roomId,
      userId,
    });
  }

  async removeParticipant(roomId: string, userId: string): Promise<void> {
    await this.client
      .delete(roomParticipants)
      .where(
        and(
          eq(roomParticipants.roomId, roomId),
          eq(roomParticipants.userId, userId)
        )
      );
  }

  async updateRoom(roomId: string, data: { name?: string; description?: string; isPublic?: boolean; avatar?: string; banner?: string }): Promise<void> {
    await this.client
      .update(rooms)
      .set(data)
      .where(eq(rooms.id, roomId));
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.client.delete(roomParticipants).where(eq(roomParticipants.roomId, roomId));
    await this.client.delete(messages).where(eq(messages.roomId, roomId));
    await this.client.delete(rooms).where(eq(rooms.id, roomId));
  }

  async fallbackLastReadMessageId(
    roomId: string,
    deletedMessageId: string,
    fallbackBeforeDate: Date
  ): Promise<void> {
    const previousMessage = await this.client.query.messages.findFirst({
      where: and(
        eq(messages.roomId, roomId),
        not(eq(messages.id, deletedMessageId)),
        sql`${messages.createdAt} <= ${fallbackBeforeDate.toISOString()}`
      ),
      orderBy: [desc(messages.createdAt)],
    });

    if (previousMessage) {
      await this.client
        .update(roomParticipants)
        .set({
          lastReadMessageId: previousMessage.id,
          lastReadAt: previousMessage.createdAt,
        })
        .where(
          and(
            eq(roomParticipants.roomId, roomId),
            eq(roomParticipants.lastReadMessageId, deletedMessageId)
          )
        );
    } else {
      await this.client
        .update(roomParticipants)
        .set({
          lastReadMessageId: null,
          // We don't overwrite lastReadAt here as part of Timestamp Fallback
          // so that the unread position remains mathematically valid.
        })
        .where(
          and(
            eq(roomParticipants.roomId, roomId),
            eq(roomParticipants.lastReadMessageId, deletedMessageId)
          )
        );
    }
  }
}
