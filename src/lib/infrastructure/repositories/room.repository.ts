import { db } from "@/lib/db";
import { rooms, roomParticipants, messages, users, userRoles, roles as rolesTable } from "@/lib/infrastructure/drizzle/schema";
import { eq, and, asc, desc, not, sql, exists, inArray } from "drizzle-orm";
import { IRoomRepository } from "@/lib/application/repositories/room.repository.interface";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { createId } from "@paralleldrive/cuid2";

export class RoomRepository implements IRoomRepository {
  constructor(private client: typeof db) { }

  async getRoomById(roomId: string): Promise<RoomWithParticipantsDTO | null> {
    console.log(`[RoomRepository] Fetching room by id: ${roomId}`);
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
      console.log(`[RoomRepository] Room ${roomId} not found`);
      return null;
    }
    console.log(`[RoomRepository] Room ${roomId} found: ${room.name}`);

    return {
      id: room.id,
      name: room.name,
      isDirect: room.isDirect,
      participants: room.participants.map((p) => ({
        lastReadAt: p.lastReadAt,
        user: {
          id: p.user.id,
          username: p.user.username,
          avatar: p.user.avatar,
          userRoles: p.user.userRoles.map((ur) => ({
            role: { name: ur.role.name },
          })),
        },
      })),
      messages: [],
    };
  }

  async getAllRoomsByUserId(
    userId: string,
    options?: { isDirect?: boolean }
  ): Promise<RoomWithParticipantsDTO[]> {
    console.log(`[RoomRepository] Fetching all rooms for user: ${userId}, options:`, options);
    // Standard join approach to find rooms the user is participating in
    const participantRooms = await this.client
      .select({ roomId: roomParticipants.roomId })
      .from(roomParticipants)
      .where(eq(roomParticipants.userId, userId));

    const roomIds = participantRooms.map(p => p.roomId);
    console.log(`[RoomRepository] User ${userId} is in rooms:`, roomIds);

    if (roomIds.length === 0) return [];

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
          limit: 1,
          orderBy: [desc(messages.createdAt)],
          columns: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    console.log(`[RoomRepository] Found ${allRooms.length} rooms for user ${userId}`);

    return allRooms.map((room) => ({
      id: room.id,
      name: room.name,
      isDirect: room.isDirect,
      participants: room.participants.map((p) => ({
        lastReadAt: p.lastReadAt,
        user: {
          id: p.user.id,
          username: p.user.username,
          avatar: p.user.avatar,
          userRoles: p.user.userRoles.map((ur) => ({
            role: { name: ur.role.name },
          })),
        },
      })),
      messages: room.messages,
    }));
  }

  async updateLastReadAt(
    userId: string,
    roomId: string,
    date: Date
  ): Promise<void> {
    await this.client
      .update(roomParticipants)
      .set({ lastReadAt: date })
      .where(
        and(
          eq(roomParticipants.roomId, roomId),
          eq(roomParticipants.userId, userId)
        )
      );
  }

  async getLastReadAt(userId: string, roomId: string): Promise<Date | null> {
    const participant = await this.client.query.roomParticipants.findFirst({
      where: and(
        eq(roomParticipants.roomId, roomId),
        eq(roomParticipants.userId, userId)
      ),
      columns: {
        lastReadAt: true,
      },
    });

    return participant?.lastReadAt ?? null;
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
    participantIds: string[]
  ): Promise<RoomWithParticipantsDTO> {
    const roomId = createId();

    return await this.client.transaction(async (tx) => {
      await tx.insert(rooms).values({
        id: roomId,
        name,
        isDirect,
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
        participants: newRoom.participants.map((p) => ({
          lastReadAt: p.lastReadAt,
          user: {
            id: p.user.id,
            username: p.user.username,
            avatar: p.user.avatar,
            userRoles: p.user.userRoles.map((ur) => ({
              role: { name: ur.role.name },
            })),
          },
        })),
        messages: [],
      };
    });
  }
}
