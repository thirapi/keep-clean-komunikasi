import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";
import { FollowUserUseCase } from "@/lib/application/use-cases/users/follow-user.use-case";
import { db } from "@/lib/db";

const followerRepository = new FollowerRepository(db);
const followUserUseCase = new FollowUserUseCase(followerRepository);

export const followUserController = async (followerId: string, followingId: string) => {
    return await followUserUseCase.execute(followerId, followingId);
};
