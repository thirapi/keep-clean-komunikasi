"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { stringToColor } from "@/utils/background-avatar";
import { Plus, Hash, User } from "lucide-react";
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

type Groups = {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  url: string;
  icon: React.ElementType;
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
  const { state } = useSidebar();
  const { onlineUserIds } = usePresence();
  const isCollapsed = state === "collapsed";

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="px-2 text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider flex items-center justify-between">
          {type}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => setOpenDMDialog(true)}
                >
                  <Plus className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Buat DM Baru</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                    <Plus />
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
                      "flex items-center transition-all duration-200 ease-in-out relative group/btn h-9",
                      isCollapsed ? "justify-center px-2" : "gap-3",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                        : "hover:bg-sidebar-accent/80 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground",
                    )}
                    tooltip={item.name}
                  >
                    <Link href={item.url} className="flex items-center w-full">
                      {isActive && !isCollapsed && (
                        <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full -ml-3" />
                      )}
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-6 w-6 rounded-md">
                          <AvatarImage
                            src={item.avatar || "/placeholder.svg"}
                            alt={item.name}
                          />
                          <AvatarFallback
                            className="text-[10px] rounded-md font-bold"
                            style={{
                              backgroundColor: stringToColor(item.userId),
                            }}
                          >
                            {item.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {onlineUserIds.includes(item.userId) && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-sidebar group-hover/btn:bg-sidebar-accent transition-colors">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <span className="truncate flex-1 text-sm">
                          {item.name}
                        </span>
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
        }}
        user={user}
      />
    </>
  );
}
