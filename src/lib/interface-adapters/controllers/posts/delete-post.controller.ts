import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { DeletePostUseCase } from "@/lib/application/use-cases/posts/delete-post.use-case";
import { PusherService } from "@/lib/infrastructure/services/pusher.service";
import { ActivityPubService } from "@/lib/infrastructure/services/activitypub.service";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";
import { RemoteActorRepository } from "@/lib/infrastructure/repositories/remote-actor.repository";
import { CustomEmojiRepository } from "@/lib/infrastructure/repositories/custom-emoji.repository";
import { db } from "@/lib/db";

const postRepository = new PostRepository(db);
const pusherService = new PusherService();
const userRepository = new UserRepository(db);
const followerRepository = new FollowerRepository(db);
const remoteActorRepository = new RemoteActorRepository(db as any);
const customEmojiRepository = new CustomEmojiRepository();
const activityPubService = new ActivityPubService(userRepository, followerRepository, postRepository, remoteActorRepository, customEmojiRepository);

const deletePostUseCase = new DeletePostUseCase(postRepository, pusherService, activityPubService);

export const deletePostController = async (postId: string, userId: string) => {
    if (!postId) {
        throw new Error("Post ID is required");
    }
    if (!userId) {
        throw new Error("User ID is required");
    }

    return await deletePostUseCase.execute(postId, userId);
};
