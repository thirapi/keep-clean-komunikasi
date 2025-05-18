import { PrismaClient } from "@/generated/prisma";
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

  async getAllRoomsByUserId(userId: string) {
    const rooms = await this.prisma.room.findMany({
      where: {
        participants: {
          some: {
            id: userId,
          },
        },
      },
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
