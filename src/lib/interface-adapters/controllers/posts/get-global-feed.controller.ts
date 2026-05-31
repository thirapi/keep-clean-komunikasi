import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { GetGlobalFeedUseCase } from "@/lib/application/use-cases/posts/get-global-feed.use-case";
import { db } from "@/lib/db";

const postRepository = new PostRepository(db);
const getGlobalFeedUseCase = new GetGlobalFeedUseCase(postRepository);

export const getGlobalFeedController = async (limit: number = 20, offset: number = 0, currentUserId?: string, filter: "all" | "local" = "all") => {
    return await getGlobalFeedUseCase.execute(limit, offset, currentUserId, filter);
};
