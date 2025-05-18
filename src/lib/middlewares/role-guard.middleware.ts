import { getUserSession } from "@/app/auth.action";
import { RoleService } from "@/lib/infrastructure/services/role.service";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";

import { prisma } from "@/lib/prisma";

export async function adminGuard() {
    const session = await getUserSession();
    const roleService = new RoleService(new UserRepository(prisma));

    const user = await roleService.getUserWithRolesFromSession(session);
    if (!user) return false;

    const hasAdmin = user.roles.some(role => role.name === "admin");
    return hasAdmin;
}