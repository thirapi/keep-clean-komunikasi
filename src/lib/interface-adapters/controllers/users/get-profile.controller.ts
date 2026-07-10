import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { db } from "@/lib/db";
import { GetProfileUseCase } from "@/lib/application/use-cases/users/get-profile.use-case";

export const getProfileController = async (username: string, currentUserId?: string) => {
    const userRepository = new UserRepository(db);
    const getProfileUseCase = new GetProfileUseCase(userRepository);

    return await getProfileUseCase.execute(username, currentUserId);
};
