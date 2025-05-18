import { CreateRolesUseCase } from "@/lib/application/use-cases/roles/create-role.use-case";
import { RoleRepository } from "@/lib/infrastructure/repositories/role.repository";

import { prisma } from "@/lib/prisma";

const roleRepository = new RoleRepository(prisma);
const createRolesUseCase = new CreateRolesUseCase(roleRepository);
export const createRolesController = async (
  name: string,
  permissions: string[],
  description?: string
): Promise<void> => {

  await createRolesUseCase.execute(name, permissions, description);
};
