import { ActivityLogRecord } from "@/lib/entities/models/activity-log.model";

export interface IActivityLogRepository {
    insertLog(log: ActivityLogRecord): Promise<void>;
    hasLogWithinLast24Hours(userId: string, action: string): Promise<boolean>;
    findAll(): Promise<ActivityLogRecord[]>;
}
