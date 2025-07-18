//src/app/(with-sidebar)/admin/users/columns.tsx

"use client";

import { ColumnDef } from "@tanstack/react-table";

import { SessionLogRecord } from "@/lib/entities/models/session.model";
export const columns: ColumnDef<SessionLogRecord>[] = [
  {
    accessorKey: "no",
    header: "#",
    cell: ({ row }) => <span className="text-sm">{row.index + 1}</span>,
    size: 40,
  },
  {
    id: "username",
    accessorFn: (row) => row.user.username,
    header: "Username",
    cell: ({ row }) => (
      <span className="font-medium text-primary">
        {row.original.user.username}
      </span>
    ),
    filterFn: "includesString",
  },
  {
    accessorKey: "createdAt",
    header: "Waktu Login",
    cell: ({ row }) => {
      const formatted = new Date(row.original.createdAt).toLocaleString(
        "id-ID",
        {
          weekday: "long", // Senin, Selasa, dst
          year: "numeric", // 2025
          month: "long", // Juli
          day: "numeric", // 17
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      );

      return <span className="text-sm text-muted-foreground">{formatted}</span>;
    },
  },
];
