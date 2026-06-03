import { db } from "@/lib/db";
import { accountFilters } from "@/lib/infrastructure/drizzle/schema";
import { eq, and, or } from "drizzle-orm";
import { IAccountFilterRepository, AccountFilterRecord } from "@/lib/application/repositories/account-filter.repository.interface";
import { createId } from "@paralleldrive/cuid2";

export class AccountFilterRepository implements IAccountFilterRepository {
    constructor(private client: typeof db) { }

    async upsert(filter: Partial<AccountFilterRecord>): Promise<void> {
        if (!filter.userId) throw new Error("userId is required");
        
        const id = filter.id || createId();
        const data = {
            id,
            userId: filter.userId,
            targetUserId: filter.targetUserId || null,
            targetRemoteActorId: filter.targetRemoteActorId || null,
            type: filter.type as "mute" | "reduce_intensity",
            updatedAt: new Date(),
        };

        // Memilih target constraint yang tepat
        const conflictTarget = data.targetRemoteActorId 
            ? [accountFilters.userId, accountFilters.targetRemoteActorId]
            : [accountFilters.userId, accountFilters.targetUserId!];

        await this.client.insert(accountFilters).values(data).onConflictDoUpdate({
            target: conflictTarget as any,
            set: {
                type: data.type,
                updatedAt: data.updatedAt,
            }
        });
    }

    async delete(userId: string, targetId: string, isRemote: boolean): Promise<void> {
        await this.client.delete(accountFilters).where(
            and(
                eq(accountFilters.userId, userId),
                isRemote 
                    ? eq(accountFilters.targetRemoteActorId, targetId) 
                    : eq(accountFilters.targetUserId, targetId)
            )
        );
    }

    async findByUserId(userId: string): Promise<AccountFilterRecord[]> {
        const results = await this.client.query.accountFilters.findMany({
            where: eq(accountFilters.userId, userId),
        });
        return results as AccountFilterRecord[];
    }

    async findSpecific(userId: string, targetId: string, isRemote: boolean): Promise<AccountFilterRecord | null> {
        const result = await this.client.query.accountFilters.findFirst({
            where: and(
                eq(accountFilters.userId, userId),
                isRemote 
                    ? eq(accountFilters.targetRemoteActorId, targetId) 
                    : eq(accountFilters.targetUserId, targetId)
            ),
        });
        return (result as AccountFilterRecord) || null;
    }
}
