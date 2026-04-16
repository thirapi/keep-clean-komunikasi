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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Compass } from "lucide-react";

type Groups = {
  id: string;
  name: string;
  url: string;
  icon: React.ElementType;
  hasUnread: boolean | null;
  unreadCount?: number;
};

export function NavMain({ 
  groups, 
  type,
  onCreate,
  onExplore
}: { 
  groups: Groups[]; 
  type: string;
  onCreate?: () => void;
  onExplore?: () => void;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-2 text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider flex items-center justify-between">
        {type}
        <div className="flex items-center gap-1">
          {onExplore && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-primary transition-colors"
              onClick={onExplore}
              title="Jelajahi Channel"
            >
              <Compass className="size-3.5" />
            </Button>
          )}
          {onCreate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-primary transition-colors"
              onClick={onCreate}
              title="Buat Channel"
            >
              <Plus className="size-3.5" />
            </Button>
          )}
        </div>
      </SidebarGroupLabel>
      <SidebarMenu>
        {[...groups].map((item) => {
          const isActive = pathname.startsWith(item.url);

          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                asChild
                tooltip={item.name}
                isActive={isActive}
                className={cn(
                  "transition-all duration-200 ease-in-out relative group/btn",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                    : "hover:bg-sidebar-accent/80 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground",
                )}
              >
                <Link href={item.url} className="flex items-center gap-2">
                  {isActive && (
                    <div className="absolute left-0 w-1 h-4 bg-primary rounded-r-full -ml-2" />
                  )}
                  <item.icon
                    className={cn("size-4", isActive && "text-primary")}
                  />
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
