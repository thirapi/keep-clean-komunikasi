import { PermissionRecord } from "@/lib/entities/models/permission.model";

export interface IPermissionRepository {
    // createPermission(name: string, description?: string): Promise<PermissionRecord>;
    // getPermissionById(permissionId: string): Promise<PermissionRecord | null>;
    getAllPermissions(): Promise<PermissionRecord[]>;
    // updatePermission(permissionId: string, data: Partial<PermissionRecord>): Promise<PermissionRecord>;
    // deletePermission(permissionId: string): Promise<void>;

    // assignPermissionToRole(roleId: string, permissionId: string): Promise<void>;
    // removePermissionFromRole(roleId: string, permissionId: string): Promise<void>;
    // getRolePermissions(roleId: string): Promise<PermissionRecord[]>;

    // hasRolePermission(roleId: string, permissionName: string): Promise<boolean>;
}