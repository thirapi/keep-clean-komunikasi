"use server";

import { getAdminStatsController } from "@/lib/interface-adapters/controllers/admin/get-stats.controller";
import { getAllActivityLogsController } from "@/lib/interface-adapters/controllers/admin/get-all-activity-logs.controller";

export const getAdminDashboardDataAction = async () => {
    const stats = await getAdminStatsController();
    const recentLogs = await getAllActivityLogsController();
    
    return {
        stats,
        recentLogs: recentLogs.slice(0, 5) // Top 5
    };
};
