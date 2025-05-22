import { PrismaClient } from "@prisma/client";
import { IRoomRepository } from "@/lib/application/repositories/room.repository.interface";

export class RoomRepository implements IRoomRepository {
  constructor(private prisma: PrismaClient) {}

  async getRoomById(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: {
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
    });

    return room;
  }

  async getAllRoomsByUserId(userId: string, options?: { isDirect?: boolean }) {
    const whereClause: any = {
      participants: {
        some: {
          id: userId,
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
    });

    return rooms;
  }
}
