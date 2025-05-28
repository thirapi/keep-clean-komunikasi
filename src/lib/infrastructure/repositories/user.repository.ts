import { PrismaClient, Prisma } from "@prisma/client";
import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";
import { RoleRecord } from "@/lib/entities/models/role.model";
import { UserRecord } from "@/lib/entities/models/user.model";

export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findByUsernameWithRoles(username: string): Promise<{
    id: string;
    username: string;
    roles: { id: string; name: string }[];
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      roles: user.userRoles.map((ur: { role: { id: string; name: string } }) => ({
        id: ur.role.id,
        name: ur.role.name,
      })),
    };
  }

  async findByIdWithRoles(id: string): Promise<{
    id: string;
    username: string;
    password: string;
    roles: { id: string; name: string }[];
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      password: user.password,
      roles: user.userRoles.map((ur: { role: { id: string; name: string } }) => ({
        id: ur.role.id,
        name: ur.role.name,
      })),
    };
  }

  async updateUserRoles(userId: string, roleIds: string[]) {
    await this.prisma.userRole.deleteMany({
      where: { userId },
    });

    if (roleIds.length === 0) {
      return;
    }

    const data = roleIds.map((roleId) => ({ userId, roleId }));
    await this.prisma.userRole.createMany({ data });
  }

async insert(user: UserRecord, tx?: Prisma.TransactionClient): Promise<void> {
  const db = tx ?? this.prisma;

  await db.user.create({
    data: {
      ...user,
      roomParticipants: {
        create: {
          room: {
            connect: {
              id: "cmak9alli0000i5sei9vn5szl",
            },
          },
          lastReadAt: new Date(),
        },
      },
    },
  });
}

  async findById(id: string): Promise<UserRecord | null> {
    return (await this.prisma.user.findUnique({
      where: { id },
    })) as UserRecord | null;
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    return (await this.prisma.user.findUnique({
      where: { username },
    })) as UserRecord | null;
  }

  async getAllUsersWithRoles(): Promise<
    { id: string; username: string; roles: { id: string; name: string }[] }[]
  > {
    const users = await this.prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return users.map((user: {
      id: string;
      username: string;
      userRoles: { role: { id: string; name: string } }[];
    }) => ({
      id: user.id,
      username: user.username,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
      })),
    }));
  }
}
