"use client";

import { useBreadcrumbs } from "@/components/breadcrumb/breadcrumb-context";
import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import { AllUsers } from "./types";
import { useEffect } from "react";

interface Props {
  users: AllUsers[];
  allRoles: string[];
  actorUserId: string;
}

export function DataTableWrapper({ users, allRoles, actorUserId }: Props) {
    const { setBreadcrumbs } = useBreadcrumbs();
  
    useEffect(() => {
      setBreadcrumbs([
        { label: "Admin", href: "/admin" },
      ]);
    }, [setBreadcrumbs]);

  const columns = getColumns(allRoles, actorUserId);
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
      <DataTable data={users} columns={columns} />
    </div>
  );
}
