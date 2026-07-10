//src/app/(with-sidebar)/admin/users/columns.tsx

"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "./_components/data-table-column-header";

import { EditRoleDialog } from "./_components/edit-role-dialog";
import { DeleteUserDialog } from "./_components/delete-user-dialog";
import { ImpersonateButton } from "./_components/impersonate-button";
import { AllUsers } from "./types";

export function getColumns(allRoles: string[], actorUserId: string): ColumnDef<AllUsers>[] {
  return [
    {
      accessorKey: "username",
      header: "Username",
      enableSorting: true,
    },
    {
      accessorKey: "roles",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Roles" />
      ),

      cell: ({ row }) => {
        const roles = row.original.roles.map((r) => r.name).join(", ");
        return <span>{roles}</span>;
      },
      enableSorting: false,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const roles = row.original.roles.map((r) => r.name);
        return (
          <div className="flex items-center gap-1">
            <ImpersonateButton targetUserId={row.original.id} username={row.original.username} />
            <EditRoleDialog
              targetUserId={row.original.id}
              initialRoles={roles}
              actorUserId={actorUserId}
              allRoles={allRoles.map((role) => ({ id: role, name: role }))}
            />
            <DeleteUserDialog
              targetUserId={row.original.id}
              username={row.original.username}
              actorUserId={actorUserId}
            />
          </div>
        );
      },
    },
  ];
}
