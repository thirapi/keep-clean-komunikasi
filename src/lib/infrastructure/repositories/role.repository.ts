import { db } from "@/lib/db";
import { roles as rolesTable, rolePermissions, permissions as permissionsTable, userRoles } from "@/lib/infrastructure/drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import { IRoleRepository } from "@/lib/application/repositories/role.repository.interface";
import { RoleFullRecord, RoleRecord } from "@/lib/entities/models/role.model";
import { createId } from "@paralleldrive/cuid2";

export class RoleRepository implements IRoleRepository {
  constructor(private client: typeof db) { }

  async deleteRole(roleId: string): Promise<void> {
    try {
      await this.client.transaction(async (tx) => {
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
        await tx.delete(rolesTable).where(eq(rolesTable.id, roleId));
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete role: ${error.message}`);
      }
      throw new Error("Failed to delete role: Unknown error.");
    }
  }

  async updateRole(
    roleId: string,
    name: string,
    permissionIds: string[],
    description?: string
  ): Promise<void> {
    try {
      await this.client.transaction(async (tx) => {
        await tx
          .update(rolesTable)
          .set({ name, description })
          .where(eq(rolesTable.id, roleId));

        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

        if (permissionIds.length > 0) {
          const data = permissionIds.map((permissionId) => ({
            id: createId(),
            roleId,
            permissionId,
          }));
          await tx.insert(rolePermissions).values(data);
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update role: ${error.message}`);
      }
      throw new Error("Failed to update role: An unknown error occurred.");
    }
  }

  async getRoleById(roleId: string): Promise<RoleFullRecord | null> {
    const roleWithPerms = await this.client.query.roles.findFirst({
      where: eq(rolesTable.id, roleId),
      with: {
        permissions: {
          with: {
            permission: true,
          },
        },
      },
    });

    if (!roleWithPerms) return null;

    return {
      id: roleWithPerms.id,
      name: roleWithPerms.name,
      description: roleWithPerms.description ?? undefined,
      createdAt: roleWithPerms.createdAt,
      permissions: roleWithPerms.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
      })),
    };
  }

  async createRole(
    name: string,
    permissionIds: string[],
    description?: string
  ): Promise<void> {
    try {
      const roleId = createId();
      await this.client.transaction(async (tx) => {
        await tx.insert(rolesTable).values({
          id: roleId,
          name,
          description,
        });

        if (permissionIds.length > 0) {
          const data = permissionIds.map((permissionId) => ({
            id: createId(),
            roleId,
            permissionId,
          }));
          await tx.insert(rolePermissions).values(data);
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create role: ${error.message}`);
      }
      throw new Error("Failed to create role: An unknown error occurred.");
    }
  }

  async getAllRoles(): Promise<RoleRecord[]> {
    const allRoles = await this.client.query.roles.findMany();
    return allRoles.map((role) => ({
      ...role,
      description: role.description ?? undefined,
    }));
  }

  async findByNames(names: string[]): Promise<{ id: string; name: string }[]> {
    if (names.length === 0) return [];
    return await this.client
      .select({ id: rolesTable.id, name: rolesTable.name })
      .from(rolesTable)
      .where(inArray(rolesTable.name, names));
  }

  async getRoleByName(name: string): Promise<RoleRecord | null> {
    const role = await this.client.query.roles.findFirst({
      where: eq(rolesTable.name, name),
    });
    return (role as RoleRecord) || null;
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await this.client.insert(userRoles).values({
      id: createId(),
      userId,
      roleId,
    });
  }
}
