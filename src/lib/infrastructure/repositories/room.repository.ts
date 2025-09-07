import { PrismaClient } from "@prisma/client";
import { IRoomRepository } from "@/lib/application/repositories/room.repository.interface";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";

export class RoomRepository implements IRoomRepository {
  constructor(private prisma: PrismaClient) {}

  async getRoomById(roomId: string): Promise<RoomWithParticipantsDTO | null> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                userRoles: {
                  select: {
                    role: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!room) return null;

    const dto: RoomWithParticipantsDTO = {
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

    return dto;
  }

  async getAllRoomsByUserId(
    userId: string,
    options?: { isDirect?: boolean }
  ): Promise<RoomWithParticipantsDTO[]> {
    const whereClause: any = {
      participants: {
        some: {
          userId: userId,
        },
      },
    };

    if (typeof options?.isDirect === "boolean") {
      whereClause.isDirect = options.isDirect;
    }

    const rooms = await this.prisma.room.findMany({
      where: whereClause,
      orderBy: {
        name: "asc",
      },
      include: {
        participants: {
          select: {
            lastReadAt: true,
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                userRoles: {
                  select: {
                    role: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    return rooms.map((room) => ({
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
    await this.prisma.roomParticipant.update({
      where: {
        roomId_userId: {
          roomId: roomId,
          userId: userId,
        },
      },
      data: {
        lastReadAt: date,
      },
    });
  }

  async getLastReadAt(userId: string, roomId: string): Promise<Date | null> {
    const participant = await this.prisma.roomParticipant.findUnique({
      where: {
        roomId_userId: { roomId: roomId, userId: userId },
      },
      select: {
        lastReadAt: true,
      },
    });

    return participant?.lastReadAt ?? null;
  }

  async getOtherParticipants(
    roomId: string,
    excludeUserId: string
  ): Promise<{ userId: string }[]> {
    const participants = await this.prisma.roomParticipant.findMany({
      where: {
        roomId,
        NOT: {
          userId: excludeUserId,
        },
      },
      select: {
        userId: true,
      },
    });

    return participants;
  }

  async createRoom(
  name: string,
  isDirect: boolean,
  participantIds: string[]
): Promise<RoomWithParticipantsDTO> {
  const room = await this.prisma.room.create({
    data: {
      name,
      isDirect,
      participants: {
        create: participantIds.map((userId) => ({
          userId,
        })),
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              userRoles: {
                select: {
                  role: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

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

}
