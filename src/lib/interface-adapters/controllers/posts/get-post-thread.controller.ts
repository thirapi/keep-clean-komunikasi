import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { GetPostThreadUseCase } from "@/lib/application/use-cases/posts/get-post-thread.use-case";
import { db } from "@/lib/db";

const postRepository = new PostRepository(db);
const getPostThreadUseCase = new GetPostThreadUseCase(postRepository);

export const getPostThreadController = async (postId: string, currentUserId?: string) => {
    return await getPostThreadUseCase.execute(postId, currentUserId);
};
