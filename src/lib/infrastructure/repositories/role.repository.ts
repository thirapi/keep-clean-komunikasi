import { PrismaClient } from "@/generated/prisma";
import { IRoleRepository } from "@/lib/application/repositories/role.repository.interface";
import { RoleFullRecord, RoleRecord } from "@/lib/entities/models/role.model";

export class RoleRepository implements IRoleRepository {
  constructor(private prisma: PrismaClient) {}

  async deleteRole(roleId: string): Promise<void> {
    try {
      await this.prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      await this.prisma.role.delete({
        where: { id: roleId },
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
      await this.prisma.role.update({
        where: { id: roleId },
        data: {
          name,
          description,
          permissions: {
            deleteMany: {},
            create: permissionIds.map((permissionId) => ({
              permission: {
                connect: { id: permissionId },
              },
            })),
          },
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update role: ${error.message}`);
      }
      throw new Error("Failed to update role: An unknown error occurred.");
    }
  }

  async getRoleById(roleId: string): Promise<RoleFullRecord | null> {
    const roleWithPermissions = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!roleWithPermissions) return null;

    return {
      id: roleWithPermissions.id,
      name: roleWithPermissions.name,
      description: roleWithPermissions.description ?? undefined,
      createdAt: roleWithPermissions.createdAt,
      permissions: roleWithPermissions.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
      })),
    };
  }

  async createRole(
    name: string,
    permissions: string[],
    description?: string
  ): Promise<void> {
    try {
      await this.prisma.role.create({
        data: {
          name,
          description,
          permissions: {
            create: permissions.map((permissionId) => ({
              permission: {
                connect: { id: permissionId },
              },
            })),
          },
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create role: ${error.message}`);
      }
      throw new Error("Failed to create role: An unknown error occurred.");
    }
  }

  async getAllRoles(): Promise<RoleRecord[]> {
    return (await this.prisma.role.findMany()).map((role) => ({
      ...role,
      description: role.description ?? undefined,
    }));
  }
  async findByNames(names: string[]): Promise<{ id: string; name: string }[]> {
    return await this.prisma.role.findMany({
      where: {
        name: { in: names },
      },
    });
  }

  async getRoleByName(name: string): Promise<RoleRecord | null> {
    return (await this.prisma.role.findUnique({
      where: { name },
    })) as RoleRecord | null;
  }
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }
}
