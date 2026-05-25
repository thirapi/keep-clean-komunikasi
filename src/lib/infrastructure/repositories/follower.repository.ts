import { db } from "@/lib/db";
import { followers } from "@/lib/infrastructure/drizzle/schema";
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
        return results.map(r => r.followerId);
    }

    async getFollowing(userId: string): Promise<string[]> {
        const results = await this.client.query.followers.findMany({
            where: eq(followers.followerId, userId),
            columns: { followingId: true }
        });
        return results.map(r => r.followingId);
    }

    async getFollowersList(userId: string): Promise<{ id: string; username: string; avatar: string }[]> {
        const results = await this.client.query.followers.findMany({
            where: eq(followers.followingId, userId),
            with: {
                follower: { columns: { id: true, username: true, avatar: true } }
            }
        });
        return results.map(r => r.follower);
    }

    async getFollowingList(userId: string): Promise<{ id: string; username: string; avatar: string }[]> {
        const results = await this.client.query.followers.findMany({
            where: eq(followers.followerId, userId),
            with: {
                following: { columns: { id: true, username: true, avatar: true } }
            }
        });
        return results.map(r => r.following);
    }

    async getFollowerCount(userId: string): Promise<number> {
        const [result] = await this.client.select({ count: sql<number>`count(*)` }).from(followers).where(eq(followers.followingId, userId));
        return Number(result?.count || 0);
    }

    async getFollowingCount(userId: string): Promise<number> {
        const [result] = await this.client.select({ count: sql<number>`count(*)` }).from(followers).where(eq(followers.followerId, userId));
        return Number(result?.count || 0);
    }
}
