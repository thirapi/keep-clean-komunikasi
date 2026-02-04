import { GetUserWithRolesUseCase } from "@/lib/application/use-cases/users/get-user-role.use-case";
import { SessionDTO } from "@/lib/entities/models/session.model";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { RoleService } from "@/lib/infrastructure/services/role.service";

import { db } from "@/lib/db";

const userRepository = new UserRepository(db);

const roleService = new RoleService(userRepository);

const getUserWithRolesUseCase = new GetUserWithRolesUseCase(roleService);

export const getUserWithRolesController = async (session: SessionDTO | null) => {

    return await getUserWithRolesUseCase.execute(session);
  };
  