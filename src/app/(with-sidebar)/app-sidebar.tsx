"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Fingerprint,
  Briefcase,
  Home,
  Users,
  User,
  Hash,
  FlameKindling,
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
import { getUserSession } from "../auth.action";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { NavMainDirectMessage } from "./nav-main-direct-message";
import K from "@/components/icons/k";
import { AllUsers } from "../admin/(with-sidebar)/users/types";
import { useRouter } from "next/navigation";
import { createRoom } from "./channels/[roomId]/room.action";
import { toast } from "sonner";

const brand = {
  name: "Komunikasi",
  logo: K,
  description: "webchat sederhana",
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  groupRooms: RoomWithParticipantsDTO[];
  directRooms: RoomWithParticipantsDTO[];
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
  const groups = groupRooms.map((room) => {
    const currentUserParticipant = room.participants.find(
      (participant) => participant.user.id === user.id,
    );

    const lastReadAt = currentUserParticipant?.lastReadAt
      ? new Date(currentUserParticipant.lastReadAt)
      : null;

    const latestMessageAt = room.messages[0]?.createdAt
      ? new Date(room.messages[0].createdAt)
      : null;

    const unreadMessages = room.messages.filter((message) => {
      const createdAt = new Date(message.createdAt);
      const isUnread = !lastReadAt || createdAt > lastReadAt;

      return isUnread;
    });

    const unreadCount = unreadMessages.length;

    const hasUnread =
      latestMessageAt && (!lastReadAt || latestMessageAt > lastReadAt);

    return {
      id: room.id,
      name: room.name,
      url: `/channels/${room.id}`,
      icon: Hash,
      unreadCount,
      hasUnread,
    };
  });

  const directMessages = directRooms.map((room) => {
    const otherUser = room.participants.find(
      (participant) => participant.user.id !== user.id,
    );

    return {
      id: room.id,
      userId: otherUser?.user.id || "",
      name: otherUser?.user.username || "unknown",
      avatar: otherUser?.user.avatar || null,
      url: `/channels/${room.id}`,
      icon: User,
    };
  });

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

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <NavBrand brand={brand} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} type="Channels" />
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
    </Sidebar>
  );
}
