import { IRoleRepository } from "../../repositories/role.repository.interface";
import cuid2 from "@paralleldrive/cuid2";

export class CreateRolesUseCase {
    constructor(
        private roleRepository: IRoleRepository,
    ) {}
    
    async execute(name: string, permissions: string [], description?: string): Promise<void> {
        const roleExists = await this.roleRepository.findByNames([name]);
      
        if (roleExists.length > 0) {
          throw new Error(`Role ${name} already exists`);
        }
      
        await this.roleRepository.createRole(name, permissions, description);
      }
      
}