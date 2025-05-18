import { GetAllRolesUseCase } from "@/lib/application/use-cases/roles/get-all-roles.usecase";
import { RoleRepository } from "@/lib/infrastructure/repositories/role.repository";

import { prisma } from "@/lib/prisma";

const roleRepository = new RoleRepository(prisma);
const getAllRolesUseCase = new GetAllRolesUseCase(roleRepository)

export const getAllRolesController = async () => {
  return await getAllRolesUseCase.execute();
};