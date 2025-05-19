import { PrismaClient } from "@prisma/client";
import { IPermissionRepository } from "@/lib/application/repositories/permission.repository.interface";
import { PermissionRecord } from "@/lib/entities/models/permission.model";

export class PermissionRepository implements IPermissionRepository {
  constructor(private prisma: PrismaClient) {}

  async getAllPermissions(): Promise<PermissionRecord[]> {
    return (await this.prisma.permission.findMany()).map((permission) => ({
      ...permission,
      description: permission.description ?? undefined,
    }));
  }
}
