import { db } from "@/lib/db";
import { IPermissionRepository } from "@/lib/application/repositories/permission.repository.interface";
import { PermissionRecord } from "@/lib/entities/models/permission.model";

export class PermissionRepository implements IPermissionRepository {
  constructor(private client: typeof db) { }

  async getAllPermissions(): Promise<PermissionRecord[]> {
    const allPermissions = await this.client.query.permissions.findMany();
    return allPermissions.map((permission) => ({
      ...permission,
      description: permission.description ?? undefined,
    }));
  }
}
