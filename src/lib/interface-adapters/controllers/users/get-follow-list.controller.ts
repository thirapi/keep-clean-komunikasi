import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";
import { GetFollowListUseCase } from "@/lib/application/use-cases/users/get-follow-list.use-case";
import { db } from "@/lib/db";

const followerRepository = new FollowerRepository(db);
const getFollowListUseCase = new GetFollowListUseCase(followerRepository);

export const getFollowersController = async (userId: string) => {
    return await getFollowListUseCase.getFollowers(userId);
};

export const getFollowingController = async (userId: string) => {
    return await getFollowListUseCase.getFollowing(userId);
};
