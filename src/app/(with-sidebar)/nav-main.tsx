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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Compass, Hash } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";

type Groups = {
  id: string;
  name: string;
  url: string;
  avatar: string;
  icon: React.ElementType;
  hasUnread: boolean;
  lastMessage?: string;
  lastMessageTime?: Date;
};

export function NavMain({ 
  groups, 
  type,
  onCreate,
  onExplore,
}: { 
  groups: Groups[]; 
  type: string;
  onCreate?: () => void;
  onExplore?: () => void;
}) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const formatTime = (date?: Date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const dayDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (dayDiff === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (dayDiff === 1) {
      return "Kemarin";
    } else if (dayDiff < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    } else {
      return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
    }
  };

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
                  "transition-all duration-200 ease-in-out relative group/btn",
                  isCollapsed ? "h-9" : "h-14",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                    : "hover:bg-sidebar-accent/80 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground",
                )}
              >
                <Link href={item.url} className={cn("flex items-center", isCollapsed ? "justify-center p-0" : "gap-3")}>
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full -ml-3" />
                  )}
                  <UserAvatar 
                    src={item.avatar} 
                    alt={item.name}
                    className="h-10 w-10 rounded-md shrink-0 border shadow-sm"
                  />
                  {!isCollapsed && (
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("truncate font-medium", item.hasUnread && "font-bold text-foreground")}>
                          {item.name}
                        </span>
                        {item.lastMessageTime && (
                          <span className="text-[10px] text-muted-foreground shrink-0 font-normal">
                            {formatTime(item.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      {item.lastMessage && (
                        <span className={cn(
                          "text-xs truncate",
                          item.hasUnread ? "text-foreground/90 font-medium" : "text-muted-foreground"
                        )}>
                          {item.lastMessage}
                        </span>
                      )}
                    </div>
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
