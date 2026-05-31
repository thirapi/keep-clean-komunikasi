import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { RemoteActorRepository } from "@/lib/infrastructure/repositories/remote-actor.repository";
import { GetPostThreadUseCase } from "@/lib/application/use-cases/posts/get-post-thread.use-case";
import { ActivityPubService } from "@/lib/infrastructure/services/activitypub.service";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";
import { db } from "@/lib/db";

const postRepository = new PostRepository(db);
const remoteActorRepository = new RemoteActorRepository(db as any);
const userRepository = new UserRepository(db);
const followerRepository = new FollowerRepository(db);
const activityPubService = new ActivityPubService(userRepository, followerRepository, postRepository, remoteActorRepository);

const getPostThreadUseCase = new GetPostThreadUseCase(postRepository, remoteActorRepository, activityPubService);

export const getPostThreadController = async (postId: string, currentUserId?: string) => {
    return await getPostThreadUseCase.execute(postId, currentUserId);
};
