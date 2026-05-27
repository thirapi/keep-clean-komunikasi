import { db } from "@/lib/db";
import { followers, remoteActors } from "@/lib/infrastructure/drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { IFollowerRepository } from "@/lib/application/repositories/follower.repository.interface";
import { FollowerRecord } from "@/lib/entities/models/follower.model";
import { createId } from "@paralleldrive/cuid2";

export class FollowerRepository implements IFollowerRepository {
    constructor(private client: typeof db) { }

    async follow(followerId: string, followingId: string): Promise<FollowerRecord> {
        const [result] = await this.client.insert(followers).values({
            id: createId(),
            followerId,
            followingId,
        }).onConflictDoNothing().returning();

        return result as unknown as FollowerRecord;
    }

    async unfollow(followerId: string, followingId: string): Promise<void> {
        await this.client.delete(followers).where(
            and(
                eq(followers.followerId, followerId),
                eq(followers.followingId, followingId)
            )
        );
    }

    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        const result = await this.client.query.followers.findFirst({
            where: and(
                eq(followers.followerId, followerId),
                eq(followers.followingId, followingId)
            )
        });
        return !!result;
    }

    async getFollowers(userId: string): Promise<string[]> {
        const results = await this.client.query.followers.findMany({
            where: eq(followers.followingId, userId),
            columns: { followerId: true }
        });
        return results.map(r => r.followerId).filter(id => id !== null) as string[];
    }

    async getFollowing(userId: string): Promise<string[]> {
        const results = await this.client.query.followers.findMany({
            where: eq(followers.followerId, userId),
            columns: { followingId: true }
        });
        return results.map(r => r.followingId).filter(id => id !== null) as string[];
    }

    async getFollowersList(userId: string): Promise<{ id: string; username: string; avatar: string; domain?: string; isRemote: boolean }[]> {
        const results = await this.client.query.followers.findMany({
            where: (followers, { or, eq }) => or(
                eq(followers.followingId, userId),
                eq(followers.remoteFollowingId, userId)
            ),
            with: {
                follower: { columns: { id: true, username: true, avatar: true } },
                remoteFollower: { columns: { id: true, username: true, avatar: true, domain: true } }
            }
        });
        
        return results.map(r => {
            if (r.remoteFollower) {
                return {
                    id: r.remoteFollower.id,
                    username: r.remoteFollower.username,
                    avatar: r.remoteFollower.avatar || "/avatars/avatar1.png",
                    domain: r.remoteFollower.domain,
                    isRemote: true
                };
            }
            if (r.follower) {
                return {
                    id: r.follower.id,
                    username: r.follower.username,
                    avatar: r.follower.avatar,
                    isRemote: false
                };
            }
            return null;
        }).filter(f => f !== null) as any;
    }

    async getFollowingList(userId: string): Promise<{ id: string; username: string; avatar: string; domain?: string; isRemote: boolean }[]> {
        const results = await this.client.query.followers.findMany({
            where: eq(followers.followerId, userId),
            with: {
                following: { columns: { id: true, username: true, avatar: true } },
                remoteFollowing: { columns: { id: true, username: true, avatar: true, domain: true } }
            }
        });
        
        return results.map(r => {
            if (r.remoteFollowing) {
                return {
                    id: r.remoteFollowing.id,
                    username: r.remoteFollowing.username,
                    avatar: r.remoteFollowing.avatar || "/avatars/avatar1.png",
                    domain: r.remoteFollowing.domain,
                    isRemote: true
                };
            }
            if (r.following) {
                return {
                    id: r.following.id,
                    username: r.following.username,
                    avatar: r.following.avatar,
                    isRemote: false
                };
            }
            return null;
        }).filter(f => f !== null) as any;
    }

    async getFollowerCount(userId: string): Promise<number> {
        const [result] = await this.client.select({ count: sql<number>`count(*)` }).from(followers).where(
            sql`${followers.followingId} = ${userId} OR ${followers.remoteFollowingId} = ${userId}`
        );
        return Number(result?.count || 0);
    }

    async getFollowingCount(userId: string): Promise<number> {
        const [result] = await this.client.select({ count: sql<number>`count(*)` }).from(followers).where(eq(followers.followerId, userId));
        return Number(result?.count || 0);
    }

    async followRemote(remoteFollowerId: string, localFollowingId: string): Promise<void> {
        await this.client.insert(followers).values({
            id: createId(),
            remoteFollowerId,
            followingId: localFollowingId,
        }).onConflictDoNothing();
    }

    async unfollowRemote(remoteFollowerId: string, localFollowingId: string): Promise<void> {
        await this.client.delete(followers).where(
            and(
                eq(followers.remoteFollowerId, remoteFollowerId),
                eq(followers.followingId, localFollowingId)
            )
        );
    }

    async followLocalToRemote(localFollowerId: string, remoteFollowingId: string): Promise<void> {
        await this.client.insert(followers).values({
            id: createId(),
            followerId: localFollowerId,
            remoteFollowingId: remoteFollowingId,
        }).onConflictDoNothing();
    }

    async unfollowLocalToRemote(localFollowerId: string, remoteFollowingId: string): Promise<void> {
        await this.client.delete(followers).where(
            and(
                eq(followers.followerId, localFollowerId),
                eq(followers.remoteFollowingId, remoteFollowingId)
            )
        );
    }

    async getRemoteFollowing(userId: string): Promise<string[]> {
        const results = await this.client.query.followers.findMany({
            where: eq(followers.followerId, userId),
            columns: { remoteFollowingId: true }
        });
        return results.map(r => r.remoteFollowingId).filter(id => id !== null) as string[];
    }

    async getRemoteFollowersInboxes(localUserId: string): Promise<string[]> {
        const results = await this.client.select({
            inbox: remoteActors.inbox,
            sharedInbox: remoteActors.sharedInbox
        })
        .from(followers)
        .innerJoin(remoteActors, eq(followers.remoteFollowerId, remoteActors.id))
        .where(eq(followers.followingId, localUserId));

        // Prefer sharedInbox if available to reduce traffic
        const inboxes = results.map(r => r.sharedInbox || r.inbox);
        return Array.from(new Set(inboxes));
    }
}
