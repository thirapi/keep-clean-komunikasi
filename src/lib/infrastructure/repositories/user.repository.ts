import { db } from "@/lib/db";
import { users, userRoles, roomParticipants, sessions, pushSubscriptions, bookmarks, messageReactions, postReactions, followers, notifications, accountFilters, activityLogs, messages, posts, attachments, rooms, postLinkPreviews, postHashtags } from "@/lib/infrastructure/drizzle/schema";
import { eq, and, sql, like, inArray, or } from "drizzle-orm";
import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";
import { UserRecord } from "@/lib/entities/models/user.model";
import { createId } from "@paralleldrive/cuid2";

export class UserRepository implements IUserRepository {
  constructor(private client: typeof db) { }

  async delete(userId: string): Promise<void> {
    await this.client.transaction(async (tx) => {
      // 1. Get user posts and messages IDs
      const userPosts = await tx.select({ id: posts.id }).from(posts).where(eq(posts.userId, userId));
      const userPostIds = userPosts.map(p => p.id);

      const userMessages = await tx.select({ id: messages.id }).from(messages).where(eq(messages.userId, userId));
      const userMessageIds = userMessages.map(m => m.id);

      // 2. Handle references to user's posts
      if (userPostIds.length > 0) {
        // Set null to posts that reply/repost/quote user's posts
        await tx.update(posts).set({ replyToId: null }).where(inArray(posts.replyToId, userPostIds));
        await tx.update(posts).set({ repostOfId: null }).where(inArray(posts.repostOfId, userPostIds));
        await tx.update(posts).set({ quoteOfId: null }).where(inArray(posts.quoteOfId, userPostIds));

        await tx.delete(postReactions).where(inArray(postReactions.postId, userPostIds));
        await tx.delete(bookmarks).where(inArray(bookmarks.postId, userPostIds));
        await tx.delete(postLinkPreviews).where(inArray(postLinkPreviews.postId, userPostIds));
        await tx.delete(postHashtags).where(inArray(postHashtags.postId, userPostIds));
        await tx.delete(attachments).where(inArray(attachments.postId, userPostIds));
        await tx.delete(posts).where(inArray(posts.id, userPostIds));
      }

      // 3. Handle references to user's messages
      if (userMessageIds.length > 0) {
        // Set null to messages that reply to user's messages
        await tx.update(messages).set({ replyTo: null }).where(inArray(messages.replyTo, userMessageIds));
        // Set null to participants lastReadMessageId pointing to user's messages
        await tx.update(roomParticipants).set({ lastReadMessageId: null }).where(inArray(roomParticipants.lastReadMessageId, userMessageIds));

        await tx.delete(messageReactions).where(inArray(messageReactions.messageId, userMessageIds));
        await tx.delete(attachments).where(inArray(attachments.messageId, userMessageIds));
        await tx.delete(messages).where(inArray(messages.id, userMessageIds));
      }

      // 4. Delete direct user data
      await tx.delete(userRoles).where(eq(userRoles.userId, userId));
      await tx.delete(sessions).where(eq(sessions.userId, userId));
      await tx.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
      await tx.delete(roomParticipants).where(eq(roomParticipants.userId, userId));
      await tx.delete(bookmarks).where(eq(bookmarks.userId, userId));
      await tx.delete(messageReactions).where(eq(messageReactions.userId, userId));
      await tx.delete(postReactions).where(eq(postReactions.userId, userId));
      await tx.delete(followers).where(or(eq(followers.followerId, userId), eq(followers.followingId, userId)));
      await tx.delete(notifications).where(or(eq(notifications.recipientId, userId), eq(notifications.actorId, userId)));
      await tx.delete(accountFilters).where(or(eq(accountFilters.userId, userId), eq(accountFilters.targetUserId, userId)));
      await tx.delete(activityLogs).where(eq(activityLogs.userId, userId));

      // 5. Handle rooms ownership
      await tx.update(rooms).set({ ownerId: null }).where(eq(rooms.ownerId, userId));

      // 6. Finally delete the user
      await tx.delete(users).where(eq(users.id, userId));
    });
  }

  async findByUsernameWithRoles(username: string): Promise<{
    id: string;
    username: string;
    name?: string | null;
    avatar: string;
    bio?: string | null;
    banner?: string | null;
    customStatus?: string | null;
    alsoKnownAs?: string[] | null;
    movedTo?: string | null;
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
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      banner: user.banner,
      customStatus: user.customStatus,
      alsoKnownAs: user.alsoKnownAs as string[] | null,
      movedTo: user.movedTo,
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
    name?: string | null;
    password: string;
    avatar: string;
    bio?: string | null;
    banner?: string | null;
    customStatus?: string | null;
    alsoKnownAs?: string[] | null;
    movedTo?: string | null;
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
      name: user.name,
      password: user.password,
      avatar: user.avatar,
      bio: user.bio,
      banner: user.banner,
      customStatus: user.customStatus,
      alsoKnownAs: user.alsoKnownAs as string[] | null,
      movedTo: user.movedTo,
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
    { id: string; username: string; name?: string | null; avatar: string; roles: { id: string; name: string }[] }[]
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
      name: user.name,
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

  async searchUsers(query: string, limit?: number): Promise<{ id: string; username: string; name?: string | null; avatar: string }[]> {
    const results = await this.client.query.users.findMany({
      where: like(users.username, `%${query}%`),
      limit: limit ?? 10,
      columns: {
        id: true,
        username: true,
        name: true,
        avatar: true,
      }
    });
    return results.map(user => ({
      ...user,
      avatar: user.avatar
    }));
  }
}
