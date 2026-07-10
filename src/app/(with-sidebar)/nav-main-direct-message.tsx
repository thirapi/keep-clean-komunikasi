"use client";

import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { usePresence } from "@/components/presence-provider";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { DirectMessageDialog } from "./direct-message-dialog";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useEmojis } from "@/components/emoji-provider";
import { stripMarkdown } from "@/lib/strip-markdown";

type Groups = {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  url: string;
  icon: React.ElementType;
  hasUnread: boolean;
  hasMention: boolean;
  lastMessage?: string;
  lastMessageTime?: Date;
};

type User = {
  id: string;
  name: string;
  initial: string;
  role: string;
  email: string;
  avatar: string;
};

export function NavMainDirectMessage({
  groups,
  type,
  user,
  onCreateDirectMessage,
}: {
  groups: Groups[];
  type: string;
  user: User;
  onCreateDirectMessage: (userId: string) => Promise<void>;
}) {
  const [openDMDialog, setOpenDMDialog] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { customEmojis } = useEmojis();
  const { onlineUserIds } = usePresence();
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
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="px-2 text-xs font-semibold text-sidebar-foreground/50 flex items-center justify-between">
          {type}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setOpenDMDialog(true)}
                  >
                    <Plus weight="duotone" className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Buat DM Baru</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </SidebarGroupLabel>
        <SidebarMenu>
          {groups.length === 0 ? (
            <SidebarGroup>
              {!isCollapsed && groups.length === 0 && (
                <div className="flex flex-col items-center justify-center px-2 py-4 text-xs text-sidebar-foreground/50">
                  <p className="mb-2 hidden lg:block">
                    Belum ada percakapan langsung.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOpenDMDialog(true)}
                    className="flex items-center justify-center"
                    title="Mulai Percakapan"
                  >
                    <Plus weight="duotone" />
                    <span className="ml-1 lg:inline">
                      Mulai Percakapan
                    </span>{" "}
                  </Button>
                </div>
              )}
            </SidebarGroup>
          ) : (
            groups.map((item) => {
              const isActive = pathname.startsWith(item.url);
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                      "flex items-center transition-all duration-200 ease-in-out relative group/btn",
                      isCollapsed ? "h-9 justify-center px-2" : "h-14 gap-3",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                        : "hover:bg-sidebar-accent/80 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground",
                    )}
                    tooltip={item.name}
                  >
                    <Link href={item.url}
                      onClick={() => isMobile && setOpenMobile(false)}
                      className="flex items-center w-full"
                    >
                      {isActive && !isCollapsed && (
                        <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full -ml-3" />
                      )}
                      <div className="relative shrink-0">
                        <UserAvatar
                          src={item.avatar}
                          alt={item.name}
                          className="h-10 w-10 rounded-md border shadow-sm shrink-0"
                        />
                        {onlineUserIds.includes(item.userId) && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-sidebar group-hover/btn:bg-sidebar-accent transition-colors">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          </span>
                        )}
                        {item.hasUnread && (
                          <div className={cn(
                            "absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar pointer-events-none flex items-center justify-center",
                            item.hasMention ? "bg-red-500 scale-125 z-10" : "bg-primary"
                          )}>
                            {item.hasMention && <span className="text-[7px] text-white font-bold leading-none">@</span>}
                          </div>
                        )}
                      </div>

                      {!isCollapsed && (
                        <div className="flex flex-col flex-1 min-w-0 ml-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={cn("truncate font-medium", item.hasUnread && "font-bold text-foreground")}>
                                {item.name}
                              </span>
                            </div>
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
                              {renderLastMessage(item.lastMessage)}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })
          )}
        </SidebarMenu>
      </SidebarGroup>
      <DirectMessageDialog
        open={openDMDialog}
        onOpenChange={setOpenDMDialog}
        onSelectUser={async (userId) => {
          await onCreateDirectMessage(userId);
          router.refresh();
          setOpenDMDialog(false);
          if (isMobile) setOpenMobile(false);
        }}
        user={user}
      />
    </>
  );
}
