"use client";

import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import { RoleRecord } from "@/lib/entities/models/role.model";
import { useBreadcrumbs } from "@/components/breadcrumb/breadcrumb-context";
import { useEffect } from "react";

interface Props {
  allRoles: RoleRecord[];
}

export function DataTableWrapper({ allRoles }: Props) {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Roles", href: "/admin/roles" },
    ]);
  }, [setBreadcrumbs]);
  
  const columns = getColumns(allRoles);
  return (
    <div className="flex h-full flex-1 flex-col space-y-8 p-3 lg:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Roles Management
          </h2>
          <p className="text-muted-foreground">
            Manage and oversee all roles in the system.
          </p>
        </div>
      </div>
      <DataTable data={allRoles} columns={columns} />
    </div>
  );
}
