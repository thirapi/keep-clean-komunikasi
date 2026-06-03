import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { AccountFilterRepository } from "@/lib/infrastructure/repositories/account-filter.repository";
import { GetGlobalFeedUseCase } from "@/lib/application/use-cases/posts/get-global-feed.use-case";
import { db } from "@/lib/db";

const postRepository = new PostRepository(db);
const accountFilterRepository = new AccountFilterRepository(db);
const getGlobalFeedUseCase = new GetGlobalFeedUseCase(postRepository, accountFilterRepository);

export const getGlobalFeedController = async (limit: number = 20, offset: number = 0, currentUserId?: string, filter: "all" | "local" = "all") => {
    return await getGlobalFeedUseCase.execute(limit, offset, currentUserId, filter);
};
