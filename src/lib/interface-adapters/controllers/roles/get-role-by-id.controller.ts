import { GetRoleByIdUseCase } from "@/lib/application/use-cases/roles/get-role-by-id.use-case";
import { RoleRepository } from "@/lib/infrastructure/repositories/role.repository";

import { db } from "@/lib/db";

const roleRepository = new RoleRepository(db);
const getRoleByIdUseCase = new GetRoleByIdUseCase(roleRepository);

export const getRoleByIdController = async (roleId: string) => {
  return await getRoleByIdUseCase.execute(roleId);
};
