import { FollowerRecord } from "@/lib/entities/models/follower.model";

export interface IFollowerRepository {
    follow(followerId: string, followingId: string): Promise<FollowerRecord>;
    unfollow(followerId: string, followingId: string): Promise<void>;
    isFollowing(followerId: string, followingId: string): Promise<boolean>;
    getFollowers(userId: string): Promise<string[]>; // Returns array of user IDs
    getFollowing(userId: string): Promise<string[]>; // Returns array of user IDs
    getFollowersList(userId: string): Promise<{ id: string; username: string; avatar: string }[]>;
    getFollowingList(userId: string): Promise<{ id: string; username: string; avatar: string }[]>;
    getFollowerCount(userId: string): Promise<number>;
    getFollowingCount(userId: string): Promise<number>;
}
