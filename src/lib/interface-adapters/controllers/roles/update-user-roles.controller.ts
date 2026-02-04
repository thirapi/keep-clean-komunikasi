import { RoleRepository } from "@/lib/infrastructure/repositories/role.repository";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { UpdateUserRolesUseCase } from "@/lib/application/use-cases/roles/update-user-roles.use-case";
import { RoleService } from "@/lib/infrastructure/services/role.service";

import { db } from "@/lib/db";

const userRepository = new UserRepository(db);
const roleRepository = new RoleRepository(db);
const roleService = new RoleService(userRepository);
const updateUserRolesUseCase = new UpdateUserRolesUseCase(userRepository, roleRepository, roleService);

export const updateUserRolesController = async (actorUserId: string, targetUserId: string, newRole: string[]): Promise<void> => {
  await updateUserRolesUseCase.execute(actorUserId, targetUserId, newRole);
};