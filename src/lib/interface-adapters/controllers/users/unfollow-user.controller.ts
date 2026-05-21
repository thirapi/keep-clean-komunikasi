import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";
import { UnfollowUserUseCase } from "@/lib/application/use-cases/users/unfollow-user.use-case";
import { db } from "@/lib/db";

const followerRepository = new FollowerRepository(db);
const unfollowUserUseCase = new UnfollowUserUseCase(followerRepository);

export const unfollowUserController = async (followerId: string, followingId: string) => {
    return await unfollowUserUseCase.execute(followerId, followingId);
};
