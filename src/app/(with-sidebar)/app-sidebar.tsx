"use client";

import * as React from "react";
import { User, Hash, Search, MessageCircle } from "lucide-react";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { NavBrand } from "./nav-brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarRoomDTO } from "@/lib/entities/models/room.model";
import { NavMainDirectMessage } from "./nav-main-direct-message";
import K from "@/components/icons/k";
import { useRouter, usePathname } from "next/navigation";
import { createRoom } from "./channels/[roomId]/room.action";
import { toast } from "sonner";
import { pusher } from "@/lib/pusher/pusher.client";
import { CreateChannelDialog } from "./create-channel-dialog";
import { ExploreChannelsDialog } from "./explore-channels-dialog";
import { useUnread } from "@/components/unread-provider";
import { Group, Panel } from "react-resizable-panels";
import { MessageSearch } from "@/components/message-search";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const brand = {
  name: "Komunikasi",
  logo: K,
  description: "webchat sederhana",
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  groupRooms: SidebarRoomDTO[];
  directRooms: SidebarRoomDTO[];
  user: {
    id: string;
    name: string;
    initial: string;
    role: string;
    email: string;
    avatar: string;
    bio?: string | null;
    banner?: string | null;
    customStatus?: string | null;
  };
  checkRole: {
    id: string;
    username: string;
    roles: {
      id: string;
      name: string;
    }[];
  } | null;
}

export function AppSidebar({
  user,
  checkRole,
  groupRooms,
  directRooms,
  ...props
}: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  const { unreadRooms, initializeUnread } = useUnread();
  const [openCreateChannel, setOpenCreateChannel] = React.useState(false);
  const [openExploreChannels, setOpenExploreChannels] = React.useState(false);
  const [openGlobalSearch, setOpenGlobalSearch] = React.useState(false);
  const [mobileTab, setMobileTab] = React.useState<"channels" | "dms">("channels");

  React.useEffect(() => {
    initializeUnread(
      [...groupRooms, ...directRooms].map((r) => ({
        id: r.id,
        hasUnread: r.hasUnread,
      })),
    );
  }, [groupRooms, directRooms, initializeUnread]);

  const groups = groupRooms.map((room) => ({
    ...room,
    icon: Hash,
    hasUnread: unreadRooms[room.id] ?? room.hasUnread,
  }));

  const directMessages = directRooms.map((room) => ({
    ...room,
    userId: room.userId ?? "",
    icon: User,
    hasUnread: unreadRooms[room.id] ?? room.hasUnread,
  }));

  async function handleCreateRoom(participantId: string) {
    const response = await createRoom(user.id, participantId);

    if (response.status === "success" && response.data) {
      if (response.meta?.action === "existing") {
        toast("Percakapan ditemukan", {
          description:
            "Anda sudah memiliki percakapan dengan pengguna ini. Membuka chat lama...",
        });
      } else {
        toast.success("Percakapan baru berhasil dibuat!", {
          description: "Anda sekarang dapat mulai mengirim pesan.",
        });
      }
      router.push(`/channels/${response.data.id}`);
    } else {
      toast.error(response.error?.message ?? "Gagal membuat percakapan");
    }
  }

  React.useEffect(() => {
    if (!user.id) return;

    const channel = pusher.subscribe(`user-${user.id}`);

    channel.bind("new-message-notification", (data: { roomId: string }) => {
      try {
        const audio = new Audio("/sounds/message-notification.mp3");
        audio.play().catch((e) => console.warn("Audio play failed", e));
      } catch (e) {
        console.warn("Audio context failed", e);
      }

      router.refresh();
    });

    channel.bind("message-deleted-notification", () => {
      router.refresh();
    });

    return () => {
      pusher.unsubscribe(`user-${user.id}`);
    };
  }, [user.id, router]);

  const isDefaultRoom = pathname === "/channels/default" || pathname === "/channels";

  return (
    <Sidebar
      collapsible={isMobile ? "none" : "icon"}
      variant={isMobile ? "sidebar" : "floating"}
      className={cn(
        "border-none bg-transparent transition-none",
        isMobile && isDefaultRoom ? "!w-full !max-w-full flex" : isMobile ? "hidden" : ""
      )}
      {...props}
    >
      <SidebarHeader>
        {isMobile ? (
          <div className="flex items-center justify-between px-2 pt-2 pb-1">
            <span className="font-bold text-xl text-primary tracking-tight ml-1">{brand.name}</span>
            <NavUser user={user} checkRole={checkRole} isMobileHeader={true} />
          </div>
        ) : (
          <NavBrand brand={brand} />
        )}
        <div className={cn("px-2 pb-0 mb-1", isMobile && "pb-2 mt-1")}>
          {isMobile ? (
            <div
              onClick={() => setOpenGlobalSearch(true)}
              className="relative flex items-center w-full h-10 px-3 cursor-text bg-muted/60 border rounded-full hover:bg-muted/80 transition-colors group"
            >
              <Search className="h-4 w-4 text-muted-foreground mr-2 group-hover:text-primary transition-colors" />
              <span className="text-sm text-muted-foreground">Cari pesan atau pengguna...</span>
            </div>
          ) : state === "expanded" ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 h-8 text-[11px] text-muted-foreground bg-muted/30 border-dashed hover:bg-muted/50 transition-all rounded-lg group"
              onClick={() => setOpenGlobalSearch(true)}
            >
              <Search className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
              <span className="truncate">Pencarian Global...</span>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-8 text-muted-foreground hover:bg-muted/50 transition-all rounded-lg"
                  onClick={() => setOpenGlobalSearch(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Pencarian</TooltipContent>
            </Tooltip>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        {isMobile ? (
          <div className="flex flex-col w-full min-w-0 pb-32">
            {mobileTab === "channels" ? (
              <NavMain
                groups={groups}
                type="Channels"
                onCreate={() => setOpenCreateChannel(true)}
                onExplore={() => setOpenExploreChannels(true)}
              />
            ) : (
              <NavMainDirectMessage
                groups={directMessages}
                type="Direct Messages"
                onCreateDirectMessage={handleCreateRoom}
                user={user}
              />
            )}
          </div>
        ) : (
          <Group orientation="vertical" className="w-full min-w-0">
            <Panel
              minSize="20%"
              style={{
                overflowX: "hidden",
                overflowY: "auto",
                width: "100%",
                minWidth: "0",
              }}
              className="min-w-0"
            >
              <NavMain
                groups={groups}
                type="Channels"
                onCreate={() => setOpenCreateChannel(true)}
                onExplore={() => setOpenExploreChannels(true)}
              />
            </Panel>

            <div className="h-px bg-border my-2 shrink-0" />

            <Panel
              minSize="20%"
              style={{
                overflowX: "hidden",
                overflowY: "auto",
                width: "100%",
                minWidth: "0",
              }}
              className="min-w-0"
            >
              <NavMainDirectMessage
                groups={directMessages}
                type="Direct Messages"
                onCreateDirectMessage={handleCreateRoom}
                user={user}
              />
            </Panel>
          </Group>
        )}
      </SidebarContent>
      {isMobile ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[85%] max-w-sm z-50">
          <div className="flex items-center justify-between gap-1 p-1.5 rounded-[2rem] bg-background/30 dark:bg-slate-900/30 backdrop-blur-xl border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-black/5 dark:ring-white/5">
            <Button
              variant="ghost"
              className={cn(
                "flex-1 h-12 rounded-full flex gap-2 font-medium transition-all duration-300 ease-out",
                mobileTab === "channels"
                  ? "bg-background/90 dark:bg-white/10 text-foreground shadow-sm ring-1 ring-border/20"
                  : "bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground"
              )}
              onClick={() => setMobileTab("channels")}
            >
              <Hash className="h-[20px] w-[20px]" />
              <span className="text-[13px] tracking-wide">Channels</span>
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "flex-1 h-12 rounded-full flex gap-2 font-medium transition-all duration-300 ease-out",
                mobileTab === "dms"
                  ? "bg-background/90 dark:bg-white/10 text-foreground shadow-sm ring-1 ring-border/20"
                  : "bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground"
              )}
              onClick={() => setMobileTab("dms")}
            >
              <MessageCircle className="h-[20px] w-[20px]" />
              <span className="text-[13px] tracking-wide">Pesan</span>
            </Button>
          </div>
        </div>
      ) : (
        <SidebarFooter>
          <NavUser user={user} checkRole={checkRole} />
        </SidebarFooter>
      )}
      <SidebarRail />
      <CreateChannelDialog
        open={openCreateChannel}
        onOpenChange={setOpenCreateChannel}
        userId={user.id}
      />
      <ExploreChannelsDialog
        open={openExploreChannels}
        onOpenChange={setOpenExploreChannels}
        userId={user.id}
      />
      <MessageSearch
        isOpen={openGlobalSearch}
        onOpenChange={setOpenGlobalSearch}
        onSelectMessage={(messageId, roomId) => {
          if (roomId) {
            router.push(`/channels/${roomId}?messageId=${messageId}`);
          }
        }}
      />
    </Sidebar>
  );
}
