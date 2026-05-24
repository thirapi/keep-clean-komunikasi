import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { InteractWithPostUseCase } from "@/lib/application/use-cases/posts/interact-with-post.use-case";
import { PusherService } from "@/lib/infrastructure/services/pusher.service";
import { db } from "@/lib/db";

const postRepository = new PostRepository(db);
const pusherService = new PusherService();
const interactWithPostUseCase = new InteractWithPostUseCase(postRepository, pusherService);

export const toggleLikeController = async (userId: string, postId: string, optimisticId?: string) => {
    return await interactWithPostUseCase.toggleLike(postId, userId, optimisticId);
};

export const repostController = async (userId: string, originalPostId: string, optimisticId?: string) => {
    return await interactWithPostUseCase.repost(userId, originalPostId, optimisticId);
};
