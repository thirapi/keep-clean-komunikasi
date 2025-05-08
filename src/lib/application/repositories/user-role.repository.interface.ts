import { RoleRecord } from "@/lib/entities/models/role.model";
import { UserRoleRecord } from "@/lib/entities/models/user-role.model";

export interface IUserRoleRepository {
    assignRoleToUser(userRole: UserRoleRecord): Promise<UserRoleRecord>;
    removeRoleFromUser(userId: string, roleId: string): Promise<void>;
    getUserRoles(userId: string): Promise<RoleRecord[]>;
}