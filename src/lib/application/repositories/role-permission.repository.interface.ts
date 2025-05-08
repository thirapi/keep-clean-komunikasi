import { PermissionRecord } from "@/lib/entities/models/permission.model";
import { RolePermissionRecord } from "@/lib/entities/models/role-permisission.model";

export interface IRolePermissionRepository {
    assignPermissionToRole(rolePermission: RolePermissionRecord): Promise<RolePermissionRecord>;
    removePermissionFromRole(roleId: string, permissionId: string): Promise<void>;
    getRolePermissions(roleId: string): Promise<PermissionRecord[]>;
}