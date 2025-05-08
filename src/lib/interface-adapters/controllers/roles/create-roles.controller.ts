import { CreateRolesUseCase } from "@/lib/application/use-cases/roles/create-role.use-case";
import { RoleRepository } from "@/lib/infrastructure/repositories/role.repository";

const roleRepository = new RoleRepository();
const createRolesUseCase = new CreateRolesUseCase(roleRepository);
export const createRolesController = async (
  name: string,
  permissions: string[],
  description?: string
): Promise<void> => {
  console.log("createRolesController received permissions:", permissions);
  await createRolesUseCase.execute(name, permissions, description);
};
