import { IRoleRepository } from "../../repositories/role.repository.interface";

export class UpdateRolesUseCase {
  constructor(private roleRepository: IRoleRepository) {}

  async execute(
    roleId: string,
    name: string,
    permissionsIDs: string[],
    description?: string,
  ): Promise<void> {
    
    await this.roleRepository.updateRole(roleId, name, permissionsIDs, description);
  }
}
