import { db } from "@/lib/db";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";
import { ActivityPubService } from "@/lib/infrastructure/services/activitypub.service";
import { FollowRemoteUserUseCase } from "@/lib/application/use-cases/users/follow-remote-user.use-case";

const userRepository = new UserRepository(db);
const followerRepository = new FollowerRepository(db);
const activityPubService = new ActivityPubService(userRepository, followerRepository);
const useCase = new FollowRemoteUserUseCase(activityPubService);

export const followRemoteUserController = async (localUserId: string, handle: string) => {
    return await useCase.execute(localUserId, handle);
};
