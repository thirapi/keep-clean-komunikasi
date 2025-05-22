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

const brand = {
  name: "Komunikasi",
  logo: FlameKindling,
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

export function AppSidebar({ user, checkRole, groupRooms, directRooms, ...props }: AppSidebarProps) {
  const groups = groupRooms.map((room) => ({
  id: room.id,
  name: room.name,
  url: `/channels/${room.id}`,
  icon: Hash, 
}));
const directMessages = directRooms.map((room) => {
  const otherUser = room.participants.find(
    (participant) => participant.id !== user.id
  );

  return {
    id: room.id,
    userId: otherUser?.id || "",
    name: otherUser?.username || "unknown",
    url: `/channels/${room.id}`,
    icon: User,
  };
});

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavBrand brand={brand} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} type="Channels" />
        <NavMainDirectMessage groups={directMessages} type="Direct Messages" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} checkRole={checkRole} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
