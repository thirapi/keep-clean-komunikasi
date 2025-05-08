import { IPermissionRepository } from "../../repositories/permission.repository.interface";

export class GetAllPermissionsUseCase {
  constructor(private permissionRepository: IPermissionRepository) {}

  async execute() {
    return await this.permissionRepository.getAllPermissions();
  }
}