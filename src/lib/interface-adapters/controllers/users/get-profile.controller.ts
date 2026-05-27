import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";
import { RemoteActorRepository } from "@/lib/infrastructure/repositories/remote-actor.repository";
import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { db } from "@/lib/db";
import { GetProfileUseCase } from "@/lib/application/use-cases/users/get-profile.use-case";

export const getProfileController = async (username: string, currentUserId?: string) => {
    const userRepository = new UserRepository(db);
    const followerRepository = new FollowerRepository(db);
    const remoteActorRepository = new RemoteActorRepository(db);
    const postRepository = new PostRepository(db);
    const getProfileUseCase = new GetProfileUseCase(userRepository, followerRepository, remoteActorRepository, postRepository);

    return await getProfileUseCase.execute(username, currentUserId);
};
