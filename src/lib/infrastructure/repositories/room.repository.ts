import { PrismaClient } from "@prisma/client";
import { IRoomRepository } from "@/lib/application/repositories/room.repository.interface";

export class RoomRepository implements IRoomRepository {
  constructor(private prisma: PrismaClient) {}

  async getRoomById(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
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
      },
    });

    return room;
  }

  async getAllRoomsByUserId(userId: string, options?: { isDirect?: boolean }) {
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
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
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

    return rooms;
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
}
