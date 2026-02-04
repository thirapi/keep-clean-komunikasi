import { GetAllRolesUseCase } from "@/lib/application/use-cases/roles/get-all-roles.usecase";
import { RoleRepository } from "@/lib/infrastructure/repositories/role.repository";

import { db } from "@/lib/db";

const roleRepository = new RoleRepository(db);
const getAllRolesUseCase = new GetAllRolesUseCase(roleRepository)

export const getAllRolesController = async () => {
  return await getAllRolesUseCase.execute();
};