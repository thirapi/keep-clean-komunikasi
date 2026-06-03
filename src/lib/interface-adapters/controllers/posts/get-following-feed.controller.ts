import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";
import { AccountFilterRepository } from "@/lib/infrastructure/repositories/account-filter.repository";
import { GetFollowingFeedUseCase } from "@/lib/application/use-cases/posts/get-following-feed.use-case";
import { db } from "@/lib/db";

const postRepository = new PostRepository(db);
const followerRepository = new FollowerRepository(db);
const accountFilterRepository = new AccountFilterRepository(db);
const getFollowingFeedUseCase = new GetFollowingFeedUseCase(postRepository, followerRepository, accountFilterRepository);

export const getFollowingFeedController = async (userId: string, limit?: number, offset?: number) => {
    return await getFollowingFeedUseCase.execute(userId, limit, offset);
};
