export interface ActivityLogRecord {
    id: string;
    userId: string | null;
    category: "auth" | "security" | "activity";
    action: string;
    metadata?: Record<string, any> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: Date;
}
