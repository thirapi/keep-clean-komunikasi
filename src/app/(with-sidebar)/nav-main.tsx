"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx"; // opsional jika mau bantu toggle class dengan clean
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Groups = {
  id: string;
  name: string;
  url: string;
  icon: React.ElementType;
  hasUnread: boolean | null;
  unreadCount?: number;
};

export function NavMain({ groups, type }: { groups: Groups[]; type: string }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-2 text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider flex items-center justify-between">
        {type}
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 hover:bg-sidebar-primary rounded-lg"
        >
          <Plus className="size-3" />
        </Button>
      </SidebarGroupLabel>
      <SidebarMenu>
        {[...groups].map((item) => {
          const isActive = pathname.startsWith(item.url);

          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                asChild
                tooltip={item.name}
                className={clsx({ "bg-muted text-foreground": isActive })}
              >
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>

              {typeof item.unreadCount === "number" && item.unreadCount > 0 && (
                <SidebarMenuBadge>{item.unreadCount}</SidebarMenuBadge>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
