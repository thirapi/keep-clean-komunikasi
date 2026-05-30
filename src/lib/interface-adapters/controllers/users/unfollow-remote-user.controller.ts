import { db } from "@/lib/db";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";
import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { RemoteActorRepository } from "@/lib/infrastructure/repositories/remote-actor.repository";
import { ActivityPubService } from "@/lib/infrastructure/services/activitypub.service";
import { UnfollowRemoteUserUseCase } from "@/lib/application/use-cases/users/unfollow-remote-user.use-case";

const userRepository = new UserRepository(db);
const followerRepository = new FollowerRepository(db);
const postRepository = new PostRepository(db);
const remoteActorRepository = new RemoteActorRepository(db as any);
const activityPubService = new ActivityPubService(userRepository, followerRepository, postRepository, remoteActorRepository);
const useCase = new UnfollowRemoteUserUseCase(activityPubService);

export const unfollowRemoteUserController = async (localUserId: string, remoteActorUrl: string) => {
    return await useCase.execute(localUserId, remoteActorUrl);
};
