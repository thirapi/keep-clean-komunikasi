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
import { useEmojis } from "@/components/emoji-provider";
import { stripMarkdown } from "@/lib/strip-markdown";
import { Button } from "@/components/ui/button";
import { Plus, Compass, Hash } from "@phosphor-icons/react/dist/ssr";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Groups = {
  id: string;
  name: string;
  url: string;
  avatar: string;
  icon: React.ElementType;
  hasUnread: boolean;
  hasMention: boolean;
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
  const { customEmojis } = useEmojis();
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const renderLastMessage = (text: string) => {
    const stripped = stripMarkdown(text);
    if (!stripped) return null;
    const html = stripped.replace(/:([a-zA-Z0-9_-]+):/g, (match, name) => {
      const emoji = customEmojis.find(e => e.shortcode === name);
      return emoji ? `<img src="${emoji.url}" alt="${match}" class="inline-block h-[1.1em] w-[1.1em] align-text-bottom" />` : match;
    });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const formatTime = (date?: Date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const dayDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (dayDiff === 0) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (dayDiff === 1) {
      return "Kemarin";
    } else if (dayDiff < 7) {
      return d.toLocaleDateString([], { weekday: "short" });
    } else {
      return d.toLocaleDateString([], { day: "numeric", month: "short" });
    }
  };

  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel className="px-3 py-2 text-[11px] font-bold tracking-wider text-sidebar-foreground/60 uppercase flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Hash weight="bold" className="size-3.5 text-primary" />
          {type}
        </span>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            {onExplore && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors rounded-md"
                    onClick={onExplore}
                    title="Jelajahi Channel"
                  >
                    <Compass weight="duotone" className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Jelajahi Channel</p>
                </TooltipContent>
              </Tooltip>
            )}
            {onCreate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors rounded-md"
                    onClick={onCreate}
                    title="Buat Channel"
                  >
                    <Plus weight="duotone" className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Buat Channel</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {[...groups].map((item) => {
          const isActive = pathname.startsWith(item.url);

          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                asChild
                tooltip={item.name}
                isActive={isActive}
                className={cn(
                  "transition-all duration-150 ease-in-out relative group/btn rounded-lg px-2.5",
                  isCollapsed ? "h-10 justify-center" : "h-12",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs"
                    : "hover:bg-sidebar-accent/60 text-sidebar-foreground/80 hover:text-sidebar-accent-foreground",
                )}
              >
                <Link href={item.url}
                  onClick={() => isMobile && setOpenMobile(false)}
                  className={cn(
                    "flex items-center w-full",
                    isCollapsed ? "justify-center p-0" : "gap-3",
                  )}
                >
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full -ml-2.5" />
                  )}
                  <div className="relative shrink-0">
                    <UserAvatar
                      src={item.avatar}
                      alt={item.name}
                      className="h-8 w-8 rounded-lg shrink-0 border border-border/40 shadow-2xs"
                    />
                    {item.hasUnread && (
                      <div className={cn(
                        "absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar pointer-events-none flex items-center justify-center",
                        item.hasMention ? "bg-red-500 scale-110 z-10" : "bg-primary"
                      )}>
                        {item.hasMention && <span className="text-[7px] text-white font-bold leading-none">@</span>}
                      </div>
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className={cn(
                            "truncate text-xs font-semibold tracking-tight leading-tight",
                            item.hasUnread ? "text-foreground font-bold" : "text-sidebar-foreground/90",
                          )}
                        >
                          {item.name}
                        </span>
                        {item.lastMessageTime && (
                          <span className="text-[10px] text-muted-foreground/70 shrink-0 font-normal">
                            {formatTime(item.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      {item.lastMessage && (
                        <span
                          className={cn(
                            "text-[11px] truncate leading-tight mt-0.5",
                            item.hasUnread
                              ? "text-foreground/90 font-medium"
                              : "text-muted-foreground/70",
                          )}
                        >
                          {renderLastMessage(item.lastMessage)}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
