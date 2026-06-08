import { db } from "@/lib/db";
import { users, sessions, activityLogs } from "@/lib/infrastructure/drizzle/schema";
import { count, gte } from "drizzle-orm";

export const getAdminStatsController = async () => {
    const totalUsers = await db.select({ value: count() }).from(users);
    const totalSessions = await db.select({ value: count() }).from(sessions);
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeToday = await db.select({ value: count() })
        .from(activityLogs)
        .where(gte(activityLogs.createdAt, twentyFourHoursAgo));

    return {
        totalUsers: totalUsers[0].value,
        totalSessions: totalSessions[0].value,
        activeToday: activeToday[0].value,
    };
};
