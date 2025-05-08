import { SessionDTO } from "@/lib/entities/models/session.model";
import { RoleService } from "@/lib/infrastructure/services/role.service";

export class GetUserWithRolesUseCase {
    constructor(private roleService: RoleService) {}
  
    async execute(session: SessionDTO | null) {
      return await this.roleService.getUserWithRolesFromSession(session);
    }
  }
  