import { IRoleRepository } from "../../repositories/role.repository.interface";

export class DeleteRoleUseCase {
    constructor(private roleRepository: IRoleRepository) {}
  
    async execute(roleId: string) {
      return await this.roleRepository.deleteRole(roleId);
    }
  }