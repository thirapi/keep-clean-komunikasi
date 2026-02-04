import { DeleteRoleUseCase } from "@/lib/application/use-cases/roles/delete-role.use-case";
import { RoleRepository } from "@/lib/infrastructure/repositories/role.repository";

import { db } from "@/lib/db";

const roleRepository = new RoleRepository(db);
const deleteRoleUseCase = new DeleteRoleUseCase(roleRepository);

export const deleteRoleController = async (roleId: string) => {
  return await deleteRoleUseCase.execute(roleId);
};