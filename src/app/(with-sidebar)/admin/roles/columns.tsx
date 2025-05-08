//src/app/(with-sidebar)/admin/users/columns.tsx

"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "./_components/data-table-column-header";

import { RoleRecord } from "@/lib/entities/models/role.model";
import { DataTableRowActions } from "./_components/data-table-row-actions";

export function getColumns(allRoles: RoleRecord[],): ColumnDef<RoleRecord>[] {
  return [

    {
      accessorKey: "roles",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Roles" />
      ),
      cell: ({ row }) => {
        return <span>{row.original.name || "Tidak ada role"}</span>;
      },
      enableSorting: false,
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        return <span>{row.original.description || "Tidak ada deskripsi"}</span>;
      },
      enableSorting: false,
    },
    {
      id: "actions",
      cell: ({ row }) => <DataTableRowActions row={row} />,
    },
  ];
}
