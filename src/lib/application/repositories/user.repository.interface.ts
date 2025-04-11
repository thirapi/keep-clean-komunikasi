import { Prisma, PrismaClient } from "@prisma/client";
import { UserRecord } from "@/lib/entities/models/user.model";

export interface IUserRepository {
  insert(user: UserRecord, tx?: Prisma.TransactionClient): Promise<void>;
  findByUsername(username: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
}
