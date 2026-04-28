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
import { useSidebar } from "@/components/ui/sidebar";
import clsx from "clsx"; // opsional jika mau bantu toggle class dengan clean
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Compass, Hash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { stringToColor } from "@/utils/background-avatar";

type Groups = {
  id: string;
  name: string;
  url: string;
  avatar: string | null;
  icon: React.ElementType;
  hasUnread: boolean;
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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-2 text-xs font-semibold text-sidebar-foreground/50 flex items-center justify-between">
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
                  "transition-all duration-200 ease-in-out relative group/btn h-9",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                    : "hover:bg-sidebar-accent/80 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground",
                )}
              >
                <Link href={item.url} className={cn("flex items-center", isCollapsed ? "justify-center p-0" : "gap-3")}>
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full -ml-3" />
                  )}
                  <Avatar className="h-7 w-7 rounded-md shrink-0 border shadow-sm">
                    <AvatarImage src={item.avatar || undefined} />
                    <AvatarFallback 
                      className="text-[8px] text-white font-bold"
                      style={{ backgroundColor: stringToColor(item.id) }}
                    >
                      {item.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <span className={cn("truncate flex-1", item.hasUnread && "font-semibold")}>{item.name}</span>
                  )}
                </Link>
              </SidebarMenuButton>

              {item.hasUnread && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary animate-pulse pointer-events-none" />
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
