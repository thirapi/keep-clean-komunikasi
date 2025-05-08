import { PrismaClient } from "@/generated/prisma";
import { IPermissionRepository } from "@/lib/application/repositories/permission.repository.interface";
import { PermissionRecord } from "@/lib/entities/models/permission.model";

export class PermissionRepository implements IPermissionRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }
  async getAllPermissions(): Promise<PermissionRecord[]> {
    return (await this.prisma.permission.findMany()).map((permission) => ({
      ...permission,
      description: permission.description ?? undefined,
    }));
  }
}
