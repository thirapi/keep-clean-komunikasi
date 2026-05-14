import { UserRecord } from "@/lib/entities/models/user.model";

export interface IUserRepository {
  insert(user: UserRecord, tx?: any): Promise<void>;
  findByUsername(username: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  findByUsernameWithRoles(username: string): Promise<{ id: string; username: string; avatar: string; bio?: string | null; banner?: string | null; customStatus?: string | null; roles: { id: string; name: string }[]; } | null>;
  findByIdWithRoles(id: string): Promise<{ id: string; username: string; password: string; avatar: string; bio?: string | null; banner?: string | null; customStatus?: string | null; roles: { id: string; name: string }[]; } | null>;
  getAllUsersWithRoles(): Promise<{ id: string; username: string; avatar: string; roles: { id: string; name: string }[] }[]>;
  updateUserRoles(userId: string, roleIds: string[]): Promise<void>;
  update(userId: string, user: Partial<UserRecord>, tx?: any): Promise<void>;
  searchUsers(query: string, limit?: number): Promise<{ id: string; username: string; avatar: string}[]>;
}
