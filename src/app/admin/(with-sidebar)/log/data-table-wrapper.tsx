"use client";

import { useBreadcrumbs } from "@/components/breadcrumb/breadcrumb-context";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { AdminUserTable } from "./types";
import { useEffect } from "react";
import { SessionLogRecord } from "@/lib/entities/models/session.model";

interface Props {
  sessions: SessionLogRecord[];
}

export function DataTableWrapper({ sessions }: Props) {
    const { setBreadcrumbs } = useBreadcrumbs();
  
    useEffect(() => {
      setBreadcrumbs([
        { label: "Admin", href: "/admin" },
      ]);
    }, [setBreadcrumbs]);

  return (
    <div className="flex h-full flex-1 flex-col space-y-8 p-3 lg:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            User Role Management
          </h2>
          <p className="text-muted-foreground">
            Manage and oversee all registered users in the system.
          </p>
        </div>
      </div>
      <DataTable data={sessions} columns={columns} />
    </div>
  );
}
