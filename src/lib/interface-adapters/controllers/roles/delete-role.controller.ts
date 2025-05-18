import { DeleteRoleUseCase } from "@/lib/application/use-cases/roles/delete-role.use-case";
import { RoleRepository } from "@/lib/infrastructure/repositories/role.repository";

import { prisma } from "@/lib/prisma";

const roleRepository = new RoleRepository(prisma);
const deleteRoleUseCase = new DeleteRoleUseCase(roleRepository);

export const deleteRoleController = async (roleId: string) => {
  return await deleteRoleUseCase.execute(roleId);
};