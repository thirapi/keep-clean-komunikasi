import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { InteractWithPostUseCase } from "@/lib/application/use-cases/posts/interact-with-post.use-case";
import { ActivityPubService } from "@/lib/infrastructure/services/activitypub.service";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";
import { RemoteActorRepository } from "@/lib/infrastructure/repositories/remote-actor.repository";
import { NotificationRepository } from "@/lib/infrastructure/repositories/notification.repository";
import { PusherService } from "@/lib/infrastructure/services/pusher.service";
import { db } from "@/lib/db";

const postRepository = new PostRepository(db);
const userRepository = new UserRepository(db);
const followerRepository = new FollowerRepository(db);
const remoteActorRepository = new RemoteActorRepository(db as any);
const activityPubService = new ActivityPubService(userRepository, followerRepository, postRepository, remoteActorRepository);
const notificationRepository = new NotificationRepository(db);
const pusherService = new PusherService();

const interactWithPostUseCase = new InteractWithPostUseCase(
    postRepository, 
    activityPubService,
    remoteActorRepository,
    notificationRepository,
    pusherService
);

export const toggleLikeController = async (userId: string, postId: string, optimisticId?: string) => {
    return await interactWithPostUseCase.toggleLike(postId, userId, optimisticId);
};

export const repostController = async (userId: string, originalPostId: string, optimisticId?: string) => {
    return await interactWithPostUseCase.repost(userId, originalPostId, optimisticId);
};
