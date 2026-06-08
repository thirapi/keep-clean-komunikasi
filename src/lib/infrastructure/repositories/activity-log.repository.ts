import { db } from "@/lib/db";
import { activityLogs } from "../drizzle/schema";
import { IActivityLogRepository } from "@/lib/application/repositories/activity-log.repository.interface";
import { ActivityLogRecord } from "@/lib/entities/models/activity-log.model";
import { and, desc, eq, gte, sql } from "drizzle-orm";

export class DrizzleActivityLogRepository implements IActivityLogRepository {
    async insertLog(log: ActivityLogRecord): Promise<void> {
        await db.insert(activityLogs).values({
            id: log.id,
            userId: log.userId,
            category: log.category,
            action: log.action,
            metadata: log.metadata,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            createdAt: log.createdAt,
        });
    }

    async hasLogWithinLast24Hours(userId: string, action: string): Promise<boolean> {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(activityLogs)
            .where(
                and(
                    eq(activityLogs.userId, userId),
                    eq(activityLogs.action, action),
                    gte(activityLogs.createdAt, twentyFourHoursAgo)
                )
            );
        return result[0].count > 0;
    }

    async findAll(): Promise<ActivityLogRecord[]> {
        const result = await db.query.activityLogs.findMany({
            orderBy: [desc(activityLogs.createdAt)],
            with: {
                user: true
            }
        });
        return result as any;
    }
}
