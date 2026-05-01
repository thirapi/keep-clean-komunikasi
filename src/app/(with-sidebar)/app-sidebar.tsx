"use client";

import * as React from "react";
import {
  User,
  Hash,
} from "lucide-react";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { NavBrand } from "./nav-brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarRoomDTO } from "@/lib/entities/models/room.model";
import { NavMainDirectMessage } from "./nav-main-direct-message";
import K from "@/components/icons/k";
import { useRouter } from "next/navigation";
import { createRoom } from "./channels/[roomId]/room.action";
import { toast } from "sonner";
import { pusher } from "@/lib/pusher/pusher.client";
import { CreateChannelDialog } from "./create-channel-dialog";
import { ExploreChannelsDialog } from "./explore-channels-dialog";
import { useUnread } from "@/components/unread-provider";

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
  const { unreadRooms, initializeUnread } = useUnread();
  const [openCreateChannel, setOpenCreateChannel] = React.useState(false);
  const [openExploreChannels, setOpenExploreChannels] = React.useState(false);

  React.useEffect(() => {
    initializeUnread([...groupRooms, ...directRooms].map(r => ({ id: r.id, hasUnread: r.hasUnread })));
  }, [groupRooms, directRooms, initializeUnread]);

  const groups = groupRooms.map((room) => ({
    ...room,
    icon: Hash,
    hasUnread: unreadRooms[room.id] ?? room.hasUnread,
  }));

  const directMessages = directRooms.map((room) => ({
    id: room.id,
    userId: room.userId ?? "",
    name: room.name,
    avatar: room.avatar,
    url: room.url,
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
      // Play sound
      try {
        const audio = new Audio("/sounds/message-notification.mp3");
        audio.play().catch((e) => console.warn("Audio play failed", e));
      } catch (e) {
        console.warn("Audio context failed", e);
      }
      
      // Update UI
      router.refresh();
    });

    return () => {
      pusher.unsubscribe(`user-${user.id}`);
    };
  }, [user.id, router]);

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="border-none bg-transparent"
      {...props}
    >
      <SidebarHeader>
        <NavBrand brand={brand} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          groups={groups}
          type="Channels"
          onCreate={() => setOpenCreateChannel(true)}
          onExplore={() => setOpenExploreChannels(true)}
        />
        <NavMainDirectMessage
          groups={directMessages}
          type="Direct Messages"
          onCreateDirectMessage={handleCreateRoom}
          user={user}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} checkRole={checkRole} />
      </SidebarFooter>
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
    </Sidebar>
  );
}
