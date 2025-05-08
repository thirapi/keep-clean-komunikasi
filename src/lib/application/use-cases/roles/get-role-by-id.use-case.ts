import { IRoleRepository } from "../../repositories/role.repository.interface";

export class GetRoleByIdUseCase {
  constructor(private roleRepository: IRoleRepository) {}
  async execute(roleId: string) {
    const role = await this.roleRepository.getRoleById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }
    return role;
  }
}
