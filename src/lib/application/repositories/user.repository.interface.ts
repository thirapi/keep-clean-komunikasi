import { Prisma } from "@/generated/prisma";
import { UserRecord } from "@/lib/entities/models/user.model";
import { RoleRecord } from "@/lib/entities/models/role.model";

export interface IUserRepository {
  insert(user: UserRecord, tx?: Prisma.TransactionClient): Promise<void>;
  findByUsername(username: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  findByUsernameWithRoles(username: string): Promise<{ id: string; username: string; roles: { id: string; name: string }[]; } | null>;
  findByIdWithRoles(id: string): Promise<{ id: string; username: string; password: string; roles: { id: string; name: string }[]; } | null>;
  getAllUsersWithRoles(): Promise<{ id: string; username: string; roles: { id: string; name: string }[] }[]>;
  updateUserRoles(userId: string, roleIds: string[]): Promise<void>;
}
