import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { GetDiscoveryFeedUseCase } from "@/lib/application/use-cases/posts/get-discovery-feed.use-case";
import { db } from "@/lib/db";

const postRepository = new PostRepository(db);
const getDiscoveryFeedUseCase = new GetDiscoveryFeedUseCase(postRepository);

export const getDiscoveryFeedController = async (limit: number = 20, offset: number = 0, currentUserId?: string) => {
    return await getDiscoveryFeedUseCase.execute(limit, offset, currentUserId);
};
