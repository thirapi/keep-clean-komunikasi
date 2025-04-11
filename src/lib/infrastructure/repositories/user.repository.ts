import { PrismaClient } from "@/generated/prisma/client";
import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";
import { UserRecord } from "@/lib/entities/models/user.model";
import { Prisma } from "@prisma/client";

export class UserRepository implements IUserRepository {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient;
    }

    async insert(user: UserRecord, tx?: Prisma.TransactionClient): Promise<void> {
        const db = tx ?? this.prisma;

        const userInsert = {
            ...user,
        }

        await db.user.create({ data: userInsert });
    }

    async findById(id: string): Promise<UserRecord | null> {
        return await this.prisma.user.findUnique({
            where: { id },
        }) as UserRecord | null;
    }

    async findByUsername(username: string): Promise<UserRecord | null> {
        return await this.prisma.user.findUnique({
            where: { username },
        }) as UserRecord | null;
    }
}