import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { DeletePostUseCase } from "@/lib/application/use-cases/posts/delete-post.use-case";
import { PusherService } from "@/lib/infrastructure/services/pusher.service";
import { db } from "@/lib/db";

const postRepository = new PostRepository(db);
const pusherService = new PusherService();
const deletePostUseCase = new DeletePostUseCase(postRepository, pusherService);

export const deletePostController = async (postId: string, userId: string) => {
    if (!postId) {
        throw new Error("Post ID is required");
    }
    if (!userId) {
        throw new Error("User ID is required");
    }

    return await deletePostUseCase.execute(postId, userId);
};
