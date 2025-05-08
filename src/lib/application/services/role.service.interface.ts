import { SessionDTO } from "@/lib/entities/models/session.model";

export interface IRoleService {
    hasRole(userId: string, roleName: string): Promise<boolean>;
    getUserRoles(userId: string): Promise<string[]>;
    getUserWithRolesFromSession(
        session: SessionDTO | null
      ): Promise<{
        id: string;
        username: string;
        roles: { id: string; name: string }[];
      } | null>;
      isUserProtected(userId: string): Promise<boolean>;  
}
