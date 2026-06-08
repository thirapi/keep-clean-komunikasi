"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityLogRecord } from "@/lib/entities/models/activity-log.model";
import { UsersIcon, ShieldCheckIcon, PulseIcon, ClockCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr";

interface Props {
    data: {
        stats: {
            totalUsers: number;
            totalSessions: number;
            activeToday: number;
        };
        recentLogs: ActivityLogRecord[];
    };
}

export function AdminDashboardContent({ data }: Props) {
    const { stats, recentLogs } = data;

    return (
        <div className="flex h-full flex-1 flex-col space-y-8 p-3 lg:p-8">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Admin Dashboard</h2>
                    <p className="text-muted-foreground">
                        Overview of your system's performance and activity.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <UsersIcon className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">Registered accounts</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                        <ShieldCheckIcon className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSessions}</div>
                        <p className="text-xs text-muted-foreground">Currently logged in</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Activity</CardTitle>
                        <PulseIcon className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeToday}</div>
                        <p className="text-xs text-muted-foreground">Actions in last 24h</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <ClockCounterClockwiseIcon className="h-4 w-4 text-primary" />
                        <CardTitle>Recent Activity</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentLogs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between border-b border-primary/5 pb-2 last:border-0">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">
                                        {(log as any).user?.username || (log.userId ? "Unknown User" : "System")}
                                    </span>
                                    <span className="text-xs text-muted-foreground capitalize">
                                        {log.category} - {log.action.replace(/_/g, " ")}
                                    </span>
                                </div>
                                <div className="text-right flex flex-col">
                                    <span className="text-xs font-mono">{log.ipAddress || "-"}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(log.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {recentLogs.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-4">No recent activity found.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
