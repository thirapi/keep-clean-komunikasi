import { RoleFullRecord, RoleRecord } from "@/lib/entities/models/role.model";

export interface IRoleRepository {
    createRole(name: string,  permissionNames: string[], description?: string,): Promise<void>;
    getRoleById(roleId: string): Promise<RoleFullRecord | null>;
    getRoleByName(name: string): Promise<RoleRecord | null>;
    getAllRoles(): Promise<RoleRecord[]>;
    updateRole(roleId: string, name: string,  permissionNames: string[], description?: string,): Promise<void>;
    deleteRole(roleId: string): Promise<void>;
    
    assignRoleToUser(userId: string, roleId: string): Promise<void>;
    findByNames(names: string[]) : Promise<{id: string; name: string}[]>;
    // removeRoleFromUser(userId: string, roleId: string): Promise<void>;
    // getUserRoles(userId: string): Promise<RoleRecord[]>;

    // hasUserRole(userId: string, roleName: string): Promise<boolean>;
}
