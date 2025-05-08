import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { GetAllUsersWithRolesUseCase } from "@/lib/application/use-cases/roles/get-all-users-with-roles.use-case";

const userRepository = new UserRepository();
const useCase = new GetAllUsersWithRolesUseCase(userRepository);

export const getAllUsersWithRolesController = async () => {
    return await useCase.execute();
};