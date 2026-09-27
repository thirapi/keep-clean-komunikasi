import { db } from "@/lib/db";
import { activityLogs } from "../drizzle/schema";
import { IActivityLogRepository } from "@/lib/application/repositories/activity-log.repository.interface";
import { ActivityLogRecord } from "@/lib/entities/models/activity-log.model";
import { desc } from "drizzle-orm";

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

    async findAll(limit = 500): Promise<ActivityLogRecord[]> {
        const result = await db.query.activityLogs.findMany({
            orderBy: [desc(activityLogs.createdAt)],
            // The admin table paginates client-side at 15 rows/page, so an
            // unbounded read shipped the entire log to the browser on every
            // visit. Bounded to a recent window instead.
            limit,
            with: {
                // The admin log only renders the author's id/username — do not
                // ship the bcrypt `password` column with every log row.
                user: {
                    columns: {
                        id: true,
                        username: true,
                    },
                }
            }
        });
        return result as any;
    }
}
