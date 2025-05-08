import { IRoleRepository } from "../../repositories/role.repository.interface";

export class GetAllRolesUseCase {
    constructor(private roleRepository: IRoleRepository) {}
  
    async execute() {
      return await this.roleRepository.getAllRoles();
    }
  }