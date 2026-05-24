import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { db } from "@/lib/db";
import { GetActorProfileUseCase } from "@/lib/application/use-cases/users/get-actor-profile.use-case";

export const getActorProfileController = async (username: string) => {
    const userRepository = new UserRepository(db);
    const getActorProfileUseCase = new GetActorProfileUseCase(userRepository);

    return await getActorProfileUseCase.execute(username);
};
