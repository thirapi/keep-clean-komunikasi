import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";
import { IRoleRepository } from "@/lib/application/repositories/role.repository.interface";
import { IRoleService } from "../../services/role.service.interface";
import { UnauthorizedError } from "@/lib/entities/errors/common";

export class UpdateUserRolesUseCase {
  constructor(
    private userRepository: IUserRepository,
    private roleRepository: IRoleRepository,
    private roleService: IRoleService
  ) {}

  async execute(actorUserId: string, targetUserId: string, newRole: string[]): Promise<void> {
    const isProtected = await this.roleService.isUserProtected(targetUserId)

    if (isProtected) {
      const actorIsSuperAdmin = await this.roleService.hasRole(actorUserId, "super_admin");

      if (!actorIsSuperAdmin) {
        throw new UnauthorizedError("You are not allowed to modify this user.");
      }
    }

    const roles = await this.roleRepository.findByNames(newRole);
    const roleIds = roles.map((r) => r.id);
    await this.userRepository.updateUserRoles(targetUserId, roleIds);
  }
}
