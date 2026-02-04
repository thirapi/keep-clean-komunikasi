import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { GetAllUsersWithRolesUseCase } from "@/lib/application/use-cases/roles/get-all-users-with-roles.use-case";

import { db } from "@/lib/db";

const userRepository = new UserRepository(db);
const useCase = new GetAllUsersWithRolesUseCase(userRepository);

export const getAllUsersWithRolesController = async () => {
    return await useCase.execute();
};