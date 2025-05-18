import { UpdateRolesUseCase } from "@/lib/application/use-cases/roles/update-role.use-case";
import { RoleRepository } from "@/lib/infrastructure/repositories/role.repository";

import { prisma } from "@/lib/prisma";

const roleRepository = new RoleRepository(prisma);

const updateRoleUseCase = new UpdateRolesUseCase(roleRepository);

export const updateRoleController = async (
    roleId: string,
    name: string,
    permissionsIDs: string[],
    description?: string,
  ): Promise<void> => {
    await updateRoleUseCase.execute(roleId, name, permissionsIDs, description);
  }