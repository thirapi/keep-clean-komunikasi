import { db } from "@/lib/db";
import { users, userRoles, roomParticipants } from "@/lib/infrastructure/drizzle/schema";
import { eq, and, sql, like } from "drizzle-orm";
import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";
import { UserRecord } from "@/lib/entities/models/user.model";
import { createId } from "@paralleldrive/cuid2";

export class UserRepository implements IUserRepository {
  constructor(private client: typeof db) { }

  async findByUsernameWithRoles(username: string): Promise<{
    id: string;
    username: string;
    avatar: string;
    bio?: string | null;
    banner?: string | null;
    customStatus?: string | null;
    roles: { id: string; name: string }[];
    createdAt: Date;
  } | null> {
    const user = await this.client.query.users.findFirst({
      where: eq(users.username, username),
      with: {
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      banner: user.banner,
      customStatus: user.customStatus,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
      })),
      createdAt: user.createdAt,
    };
  }

  async findByIdWithRoles(id: string): Promise<{
    id: string;
    username: string;
    password: string;
    avatar: string;
    bio?: string | null;
    banner?: string | null;
    customStatus?: string | null;
    roles: { id: string; name: string }[];
  } | null> {
    const user = await this.client.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        userRoles: {
          with: {
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
      avatar: user.avatar,
      bio: user.bio,
      banner: user.banner,
      customStatus: user.customStatus,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
      })),
    };
  }

  async updateUserRoles(userId: string, roleIds: string[]) {
    await this.client.transaction(async (tx) => {
      await tx.delete(userRoles).where(eq(userRoles.userId, userId));

      if (roleIds.length === 0) return;

      const data = roleIds.map((roleId) => ({
        id: createId(),
        userId,
        roleId,
      }));
      await tx.insert(userRoles).values(data);
    });
  }

  async insert(user: UserRecord, tx?: any): Promise<void> {
    const client = tx ?? this.client;

    await client.transaction(async (innerTx: any) => {
      await innerTx.insert(users).values(user);

      // Pastikan roomId sama dengan yang ada di migration (general-channel)
      await innerTx.insert(roomParticipants).values({
        id: createId(),
        roomId: "general-channel",
        userId: user.id,
        lastReadAt: new Date(),
      });
    });
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.client.query.users.findFirst({
      where: eq(users.id, id),
    });
    return user as UserRecord | null;
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const user = await this.client.query.users.findFirst({
      where: eq(users.username, username),
    });
    return user as UserRecord | null;
  }

  async getAllUsersWithRoles(): Promise<
    { id: string; username: string; avatar: string; roles: { id: string; name: string }[] }[]
  > {
    const allUsers = await this.client.query.users.findMany({
      with: {
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });

    return allUsers.map((user) => ({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
      })),
    }));
  }

  async update(
    userId: string,
    user: Partial<UserRecord>,
    tx?: any
  ): Promise<void> {
    const client = tx ?? this.client;
    await client.update(users).set(user).where(eq(users.id, userId));
  }

  async searchUsers(query: string, limit?: number): Promise<{ id: string; username: string; avatar: string }[]> {
    const results = await this.client.query.users.findMany({
      where: like(users.username, `%${query}%`),
      limit: limit ?? 10,
      columns: {
        id: true,
        username: true,
        avatar: true,
      }
    });
    return results.map(user => ({
      ...user,
      avatar: user.avatar
    }));
  }
}
