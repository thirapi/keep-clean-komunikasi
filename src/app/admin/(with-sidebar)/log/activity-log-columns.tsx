"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ActivityLogRecord } from "@/lib/entities/models/activity-log.model";

export const activityLogColumns: ColumnDef<ActivityLogRecord>[] = [
  {
    accessorKey: "no",
    header: "#",
    cell: ({ row }) => <span className="text-sm">{row.index + 1}</span>,
    size: 40,
  },
  {
    id: "username",
    accessorFn: (row) => {
        const user = (row as any).user;
        if (user?.username) return user.username;
        if (row.userId) return `ID: ${row.userId.substring(0, 8)}...`;
        return "System";
    },
    header: "User",
    cell: ({ row }) => {
        const user = (row.original as any).user;
        return (
            <div className="flex flex-col">
                <span className="font-medium text-primary">
                    {user?.username || (row.original.userId ? `Unknown User` : "System")}
                </span>
                {row.original.userId && !user?.username && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                        {row.original.userId}
                    </span>
                )}
            </div>
        );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.category}</span>
    ),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.action}</span>
    ),
  },
  {
    accessorKey: "ipAddress",
    header: "IP Address",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.original.ipAddress || "-"}</span>
    ),
  },
  {
    id: "location",
    accessorFn: (row) => {
      const loc = (row as any).metadata?.location;
      if (!loc) return "-";
      return [loc.city, loc.region, loc.country].filter(Boolean).join(", ");
    },
    header: "Location",
    cell: ({ row }) => {
      const loc = (row.original as any).metadata?.location;
      if (!loc) return <span className="text-xs text-muted-foreground">-</span>;
      const parts = [loc.city, loc.region, loc.country].filter(Boolean);
      return <span className="text-xs text-muted-foreground">{parts.join(", ")}</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Timestamp",
    cell: ({ row }) => {
      const formatted = new Date(row.original.createdAt).toLocaleString(
        "id-ID",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      );
      return <span className="text-xs text-muted-foreground">{formatted}</span>;
    },
  },
];
