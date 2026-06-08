"use client";

import { useBreadcrumbs } from "@/components/breadcrumb/breadcrumb-context";
import { columns } from "./columns";
import { activityLogColumns } from "./activity-log-columns";
import { DataTable } from "./data-table";
import { useEffect } from "react";
import { SessionLogRecord } from "@/lib/entities/models/session.model";
import { ActivityLogRecord } from "@/lib/entities/models/activity-log.model";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  sessions: SessionLogRecord[];
  activityLogs: ActivityLogRecord[];
}

export function DataTableWrapper({ sessions, activityLogs }: Props) {
    const { setBreadcrumbs } = useBreadcrumbs();
  
    useEffect(() => {
      setBreadcrumbs([
        { label: "Admin", href: "/admin" },
        { label: "Logs", href: "/admin/log" },
      ]);
    }, [setBreadcrumbs]);

  return (
    <div className="flex h-full flex-1 flex-col space-y-8 p-3 lg:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            System Logs & Activity
          </h2>
          <p className="text-muted-foreground">
            Monitor user sessions and security activity logs.
          </p>
        </div>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="space-y-4">
            <DataTable data={activityLogs} columns={activityLogColumns} />
        </TabsContent>
        <TabsContent value="sessions" className="space-y-4">
            <DataTable data={sessions} columns={columns} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
