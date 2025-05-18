import { GetAllPermissionsUseCase } from "@/lib/application/use-cases/permissions/get-all-permission.use-case";
import { PermissionRepository } from "@/lib/infrastructure/repositories/permission.repository";

import { prisma } from "@/lib/prisma";

const permissionRepository = new PermissionRepository(prisma);
const getAllPermissionsUseCase = new GetAllPermissionsUseCase(
  permissionRepository
);

export const getAllPermissionsController = async () => {
  return await getAllPermissionsUseCase.execute();
};
