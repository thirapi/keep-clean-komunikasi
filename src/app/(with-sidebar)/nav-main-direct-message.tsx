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
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DirectMessageDialog } from "./direct-message-dialog";
import { AllUsers } from "../admin/(with-sidebar)/users/types";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  users,
  user,
  onCreateDirectMessage,
}: {
  groups: Groups[];
  type: string;
  users: AllUsers[];
  user: User;
  onCreateDirectMessage: (userId: string) => Promise<void>;
}) {
  const [openDMDialog, setOpenDMDialog] = useState(false);
  const router = useRouter();
  const { state } = useSidebar();
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
            [...groups].map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  className="flex items-center gap-2"
                  asChild
                  tooltip={item.name}
                >
                  <Link href={item.url} className="relative">
                    <Avatar className="h-6 w-6 rounded-md">
                      <AvatarImage
                        src={item.avatar || "/placeholder.svg"}
                        alt="Current Avatar"
                      />
                      <AvatarFallback
                        className="text-xs rounded-md"
                        style={{ backgroundColor: stringToColor(item.userId) }}
                      >
                        {item.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>@{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
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
        usersData={users}
        user={user}
      />
    </>
  );
}
