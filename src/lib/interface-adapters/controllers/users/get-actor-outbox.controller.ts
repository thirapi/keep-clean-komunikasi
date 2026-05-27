import { GetActorOutboxUseCase } from "@/lib/application/use-cases/users/get-actor-outbox.use-case";
import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { db } from "@/lib/db";

export const getActorOutboxController = async (username: string) => {
    const userRepository = new UserRepository(db);
    const postRepository = new PostRepository(db);
    const getActorOutboxUseCase = new GetActorOutboxUseCase(userRepository, postRepository);

    return await getActorOutboxUseCase.execute(username);
};
