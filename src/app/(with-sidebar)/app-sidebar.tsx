"use client";

import * as React from "react";
import { User, Hash, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

import { NavMain } from "./nav-main";
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
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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

const brand = {
  name: "komunikasi.qzz.io",
  logo: K,
  description: "webchat sederhana",
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  groupRooms: SidebarRoomDTO[];
  directRooms: SidebarRoomDTO[];
  user: {
    id: string;
    name: string;
    username: string;
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
  const searchParams = useSearchParams();
  const isMobileFromHook = useIsMobile();
  const { state } = useSidebar();
  const { unreadRooms, initializeUnread } = useUnread();
  const [openCreateChannel, setOpenCreateChannel] = React.useState(false);
  const [openExploreChannels, setOpenExploreChannels] = React.useState(false);
  const [openSearchUser, setOpenSearchUser] = React.useState(false);
  const [openGlobalSearch, setOpenGlobalSearch] = React.useState(false);
  const [mobileTab, setMobileTab] = React.useState<"channels" | "dms">("channels");
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const isMobile = isMobileFromHook ?? false;
  
  // Prefetch main routes for seamless transitions
  React.useEffect(() => {
    router.prefetch("/channels/default");
  }, [router]);

  // Sync mobileTab with pathname and searchParams
  React.useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl === "channels" || tabFromUrl === "dms") {
      setMobileTab(tabFromUrl);
      return;
    }
    const currentRoomId = pathname.split("/").pop();
    const isDM = directRooms.some(r => r.id === currentRoomId);
    const isChannel = groupRooms.some(r => r.id === currentRoomId);
    
    if (isDM) setMobileTab("dms");
    else if (isChannel) setMobileTab("channels");
  }, [pathname, searchParams, directRooms, groupRooms]);

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

  const isDefaultRoom = pathname === "/channels/default" || pathname === "/channels";

  // Centralized search handler
  const handleSearchClick = () => {
    setOpenGlobalSearch(true);
  };

  const searchTooltip = "Cari Pesan";

  // Prevent layout shift by rendering a static/skeleton state or null until mounted
  if (!isMounted) {
    return (
      <Sidebar collapsible="none" className="border-none bg-transparent" {...props}>
        <div className="flex items-center gap-2 px-6 py-4 opacity-0" />
      </Sidebar>
    );
  }

  // Since microblogging is disabled, the app is chat-only

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
                 {user && (
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-9 w-9 p-2 text-muted-foreground hover:bg-muted/50 rounded-lg shrink-0"
                         onClick={handleSearchClick}
                       >
                         <MagnifyingGlass weight="duotone" className="h-4 w-4" />
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent side="bottom">{searchTooltip}</TooltipContent>
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
          </div>
        )}
        {!isMobile && state === "collapsed" && user && (
          <div className="pb-2 mt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-8 text-muted-foreground hover:bg-muted/50 transition-all rounded-lg"
                  onClick={() => setOpenGlobalSearch(true)}
                >
                  <MagnifyingGlass weight="duotone" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Cari Pesan</TooltipContent>
            </Tooltip>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden pt-2">
        {isMobile ? (
          <div className="flex flex-col w-full min-w-0 pb-4">
            {user ? (
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
            {user ? (
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
      {!isMobile && (
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
                    <User weight="duotone" className="size-4" />
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
