import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { GetAllUsersWithRolesUseCase } from "@/lib/application/use-cases/roles/get-all-users-with-roles.use-case";

import { prisma } from "@/lib/prisma";

const userRepository = new UserRepository(prisma);
const useCase = new GetAllUsersWithRolesUseCase(userRepository);

export const getAllUsersWithRolesController = async () => {
    return await useCase.execute();
};