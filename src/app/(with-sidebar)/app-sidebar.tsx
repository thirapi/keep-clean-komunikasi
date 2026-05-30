"use client";

import * as React from "react";
import { User, Hash, Search, MessageCircle, ChevronDown, Rss } from "lucide-react";
import Link from "next/link";

import { NavMain } from "./nav-main";
import { NavFeed } from "./nav-feed";
import { NavUser } from "./nav-user";
import { NavBrand } from "./nav-brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
import { SearchUserDialog } from "./search-user-dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const brand = {
  name: "komunikasi",
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
  } | null;
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
  const isMobileFromHook = useIsMobile();
  const { state } = useSidebar();
  const { unreadRooms, initializeUnread } = useUnread();
  const [openCreateChannel, setOpenCreateChannel] = React.useState(false);
  const [openExploreChannels, setOpenExploreChannels] = React.useState(false);
  const [openSearchUser, setOpenSearchUser] = React.useState(false);
  const [openGlobalSearch, setOpenGlobalSearch] = React.useState(false);
  const [mobileTab, setMobileTab] = React.useState<"channels" | "dms" | "social">("channels");
  const [sidebarMode, setSidebarMode] = React.useState<"chat" | "feed">("chat");
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const isMobile = isMobileFromHook ?? false;

  // Sync sidebarMode with mobileTab when on mobile
  React.useEffect(() => {
    if (isMobile) {
      if (mobileTab === "social") {
        setSidebarMode("feed");
      } else {
        setSidebarMode("chat");
      }
    }
  }, [isMobile, mobileTab]);

  React.useEffect(() => {
    initializeUnread(
      [...groupRooms, ...directRooms].map((r) => ({
        id: r.id,
        hasUnread: r.hasUnread,
        hasMention: (r as any).hasMention,
      })),
    );
  }, [groupRooms, directRooms, initializeUnread]);

  const groups = groupRooms.map((room) => ({
    ...room,
    icon: Hash,
    hasUnread: unreadRooms[room.id]?.hasUnread ?? room.hasUnread,
    hasMention: unreadRooms[room.id]?.hasMention ?? room.hasMention,
  }));

  const directMessages = directRooms.map((room) => ({
    ...room,
    userId: room.userId ?? "",
    icon: User,
    hasUnread: unreadRooms[room.id]?.hasUnread ?? room.hasUnread,
    hasMention: unreadRooms[room.id]?.hasMention ?? room.hasMention,
  }));

  async function handleCreateRoom(participantId: string) {
    if (!user) {
      toast.error("Silakan login untuk memulai percakapan");
      return;
    }
    const response = await createRoom(user!.id, participantId);

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
    if (!user?.id) return;

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
      pusher.unsubscribe(`user-${user?.id}`);
    };
  }, [user?.id, router]);

  const isDefaultRoom = pathname === "/channels/default" || pathname === "/channels";

  // Prevent layout shift by rendering a static/skeleton state or null until mounted
  if (!isMounted) {
    return (
      <Sidebar collapsible="none" className="border-none bg-transparent" {...props}>
        <div className="flex items-center gap-2 px-6 py-4 opacity-0" />
      </Sidebar>
    );
  }

  const ModeSwitcher = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 hover:bg-muted/50 rounded-lg h-9 transition-all group min-w-0"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {sidebarMode === "chat" ? (
              <>
                <MessageCircle className="size-4 text-primary shrink-0" />
                <span className="font-bold text-sm truncate">Chat</span>
              </>
            ) : (
              <>
                <Rss className="size-4 text-primary shrink-0" />
                <span className="font-bold text-sm truncate">Social Feed</span>
              </>
            )}
          </div>
          <ChevronDown className="size-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 mt-1 p-1">
        <DropdownMenuItem
          onClick={() => setSidebarMode("chat")}
          className={cn(
            "flex items-center gap-2.5 p-2 rounded-md cursor-pointer",
            sidebarMode === "chat" && "bg-muted font-medium"
          )}
        >
          <MessageCircle className={cn("size-4", sidebarMode === "chat" ? "text-primary" : "text-muted-foreground")} />
          <span className="text-sm">Chat</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setSidebarMode("feed")}
          className={cn(
            "flex items-center gap-2.5 p-2 rounded-md cursor-pointer",
            sidebarMode === "feed" && "bg-muted font-medium"
          )}
        >
          <Rss className={cn("size-4", sidebarMode === "feed" ? "text-primary" : "text-muted-foreground")} />
          <span className="text-sm">Social Feed</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <Sidebar
      collapsible="none"
      variant={isMobile ? "sidebar" : "inset"}
      className={cn(
        "border-none bg-transparent transition-none",
        isDefaultRoom ? "max-md:!w-full max-md:!max-w-full max-md:flex" : "max-md:hidden"
      )}
      {...props}
    >
      <SidebarHeader>
        {isMobile ? (
          <div className="flex items-center justify-between pt-1 pb-1">
            <div className="flex items-center gap-1.5 min-w-0">
               <span className="font-bold text-xl text-primary tracking-tight ml-1 shrink-0">{brand.name}</span>
               <div className="w-px h-4 bg-border/60 mx-0.5 shrink-0" />
               <div className="flex items-center gap-0.5 min-w-0">
                 {user && sidebarMode === "chat" && (
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-9 w-9 p-2 text-muted-foreground hover:bg-muted/50 rounded-lg shrink-0"
                         onClick={() => setOpenGlobalSearch(true)}
                       >
                         <Search className="h-4 w-4" />
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent side="bottom">Pencarian</TooltipContent>
                   </Tooltip>
                 )}
               </div>
            </div>
            {user ? (
              <NavUser user={user} checkRole={checkRole} isMobileHeader={true} />
            ) : (
              <Button size="sm" onClick={() => router.push("/")} className="rounded-full h-8 px-4">
                Login
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <NavBrand brand={brand} />
            {state === "expanded" && (
              <div className="pb-1 flex items-center justify-between gap-1">
                 <ModeSwitcher />
                 {user && sidebarMode === "chat" && (
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-9 w-9 p-2 text-muted-foreground hover:bg-muted/50 rounded-lg shrink-0"
                         onClick={() => setOpenGlobalSearch(true)}
                       >
                         <Search className="h-4 w-4" />
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent side="right">Pencarian</TooltipContent>
                   </Tooltip>
                 )}
              </div>
            )}
          </div>
        )}
        {!isMobile && state === "collapsed" && user && sidebarMode === "chat" && (
          <div className="pb-2 mt-1">
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
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden pt-2">
        {isMobile ? (
          <div className="flex flex-col w-full min-w-0 pb-4">
            {mobileTab === "social" ? (
              <NavFeed onRemoteFollow={() => setOpenSearchUser(true)} />
            ) : user ? (
              mobileTab === "channels" ? (
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
              )
            ) : (
              <div className="p-6 text-center py-10 opacity-60">
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  Login untuk mengakses percakapan dan fitur premium lainnya.
                </p>
              </div>
            )}
          </div>
        ) : (
          <Group orientation="vertical" className="w-full min-w-0 h-full">
            {sidebarMode === "feed" ? (
              <Panel
                minSize="15%"
                style={{
                  overflowX: "hidden",
                  overflowY: "auto",
                  width: "100%",
                  minWidth: "0",
                }}
                className="min-w-0"
              >
                <NavFeed onRemoteFollow={() => setOpenSearchUser(true)} />
              </Panel>
            ) : user ? (
              <>
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

                <div className="h-2 shrink-0" />

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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 opacity-40 select-none pointer-events-none">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-px bg-border w-8 mx-auto" />
                </div>
              </div>
            )}
          </Group>
        )}
      </SidebarContent>
      {isMobile ? (
        <SidebarFooter className="border-t bg-background p-1.5 mt-auto shrink-0 shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)] sticky bottom-0">
          <div className="flex w-full items-center justify-around gap-1 px-1">
            <Button
              variant="ghost"
              className={cn("flex-1 flex-col h-auto py-2.5 gap-1 rounded-xl shadow-none hover:bg-muted/50 transition-colors", mobileTab === "channels" ? "text-primary" : "text-muted-foreground")}
              onClick={() => setMobileTab("channels")}
            >
              <Hash className="h-[22px] w-[22px]" strokeWidth={mobileTab === "channels" ? 3 : 2} />
              <span className={cn("text-[10px] tracking-wide", mobileTab === "channels" ? "font-bold" : "font-medium")}>Channels</span>
            </Button>
            <Button
              variant="ghost"
              className={cn("flex-1 flex-col h-auto py-2.5 gap-1 rounded-xl shadow-none hover:bg-muted/50 transition-colors", mobileTab === "dms" ? "text-primary" : "text-muted-foreground")}
              onClick={() => setMobileTab("dms")}
            >
              <MessageCircle className="h-[22px] w-[22px]" fill={mobileTab === "dms" ? "currentColor" : "none"} strokeWidth={mobileTab === "dms" ? 0 : 2} />
              <span className={cn("text-[10px] tracking-wide", mobileTab === "dms" ? "font-bold" : "font-medium")}>Pesan</span>
            </Button>
            <Button
              variant="ghost"
              className={cn("flex-1 flex-col h-auto py-2.5 gap-1 rounded-xl shadow-none hover:bg-muted/50 transition-colors", mobileTab === "social" ? "text-primary" : "text-muted-foreground")}
              onClick={() => setMobileTab("social")}
            >
              <Rss className="h-[22px] w-[22px]" strokeWidth={mobileTab === "social" ? 3 : 2} />
              <span className={cn("text-[10px] tracking-wide", mobileTab === "social" ? "font-bold" : "font-medium")}>Social</span>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="flex-1 flex-col h-auto py-2.5 gap-1 rounded-xl shadow-none hover:bg-muted/50 transition-colors text-muted-foreground"
            >
              <Link href={user ? `/profile/${user.name}` : "/"}>
                <User className="h-[22px] w-[22px]" strokeWidth={2} />
                <span className="text-[10px] font-medium tracking-wide">{user ? "Profil" : "Masuk"}</span>
              </Link>
            </Button>
          </div>
        </SidebarFooter>
      ) : (
        <SidebarFooter>
          {user ? (
            <NavUser user={user} checkRole={checkRole} />
          ) : (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-300 group/login"
                  onClick={() => router.push("/")}
                  tooltip="Masuk ke Komunikasi"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover/login:scale-110 transition-transform duration-300">
                    <User className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                    <span className="truncate font-semibold">Masuk Akun</span>
                    <span className="truncate text-[11px] text-muted-foreground">Masuk untuk memulai</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarFooter>
      )}
      <SidebarRail />
      <CreateChannelDialog
        open={openCreateChannel}
        onOpenChange={setOpenCreateChannel}
        userId={user?.id || ""}
      />
      <ExploreChannelsDialog
        open={openExploreChannels}
        onOpenChange={setOpenExploreChannels}
        userId={user?.id || ""}
      />
      <SearchUserDialog
        open={openSearchUser}
        onOpenChange={setOpenSearchUser}
        userId={user?.id || ""}
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
