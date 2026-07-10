"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ActivityLogRecord } from "@/lib/entities/models/activity-log.model";
import { DeviceInfo } from "@/lib/device-info";
import { Desktop, DeviceMobile, DeviceTablet } from "@phosphor-icons/react/dist/ssr";

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
    id: "device",
    accessorFn: (row) => {
      const device = (row as any).metadata?.device as DeviceInfo | undefined;
      if (!device) return "-";
      return `${device.deviceType} ${device.os} ${device.browser}`;
    },
    header: "Device",
    cell: ({ row }) => {
      const device = (row.original as any).metadata?.device as DeviceInfo | undefined;
      if (!device) return <span className="text-xs text-muted-foreground">-</span>;

      const DeviceIcon = device.deviceType === "mobile"
        ? DeviceMobile
        : device.deviceType === "tablet"
          ? DeviceTablet
          : Desktop;

      return (
        <div className="flex items-center gap-2 min-w-0">
          <DeviceIcon className="h-4 w-4 text-muted-foreground shrink-0" weight="duotone" />
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-xs font-medium truncate">{device.os}</span>
            <span className="text-[10px] text-muted-foreground truncate">{device.browser}</span>
          </div>
        </div>
      );
    },
    size: 180,
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
