import { GetAllPermissionsUseCase } from "@/lib/application/use-cases/permissions/get-all-permission.use-case";
import { PermissionRepository } from "@/lib/infrastructure/repositories/permission.repository";

const permissionRepository = new PermissionRepository();
const getAllPermissionsUseCase = new GetAllPermissionsUseCase(
  permissionRepository
);

export const getAllPermissionsController = async () => {
  return await getAllPermissionsUseCase.execute();
};
