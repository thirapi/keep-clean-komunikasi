import { db } from "@/lib/db";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";
import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { RemoteActorRepository } from "@/lib/infrastructure/repositories/remote-actor.repository";
import { CustomEmojiRepository } from "@/lib/infrastructure/repositories/custom-emoji.repository";
import { ActivityPubService } from "@/lib/infrastructure/services/activitypub.service";
import { FollowRemoteUserUseCase } from "@/lib/application/use-cases/users/follow-remote-user.use-case";

const userRepository = new UserRepository(db);
const followerRepository = new FollowerRepository(db);
const postRepository = new PostRepository(db);
const remoteActorRepository = new RemoteActorRepository(db as any);
const customEmojiRepository = new CustomEmojiRepository();
const activityPubService = new ActivityPubService(userRepository, followerRepository, postRepository, remoteActorRepository, customEmojiRepository);
const useCase = new FollowRemoteUserUseCase(activityPubService);

export const followRemoteUserController = async (localUserId: string, handle: string) => {
    return await useCase.execute(localUserId, handle);
};
