import { ActivityLogRecord } from "@/lib/entities/models/activity-log.model";

export interface IActivityLogRepository {
    insertLog(log: ActivityLogRecord): Promise<void>;
    findAll(limit?: number): Promise<ActivityLogRecord[]>;
}
