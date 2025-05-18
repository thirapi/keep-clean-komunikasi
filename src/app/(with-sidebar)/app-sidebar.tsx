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

const groups = [
  {
    id: "1",
    name: "Dashboard",
    url: "/dashboard",
    icon: Home,
    onClick: () => console.log("Go to Dashboard"),
  },
  {
    id: "2",
    name: "Team",
    url: "/team",
    icon: Users,
    onClick: () => console.log("Go to Team"),
  },
  {
    id: "3",
    name: "Projects",
    url: "/projects",
    icon: Briefcase,
    onClick: () => console.log("Go to Projects"),
  },
];

const users = [
  {
    id: "1",
    name: "user1",
    url: "/dashboard",
    icon: User,
    onClick: () => console.log("Go to Dashboard"),
  },
  {
    id: "2",
    name: "user2",
    url: "/team",
    icon: User,
    onClick: () => console.log("Go to Team"),
  },
  {
    id: "3",
    name: "user3",
    url: "/projects",
    icon: User,
    onClick: () => console.log("Go to Projects"),
  },
];

const brand = {
  name: "Komunikasi",
  logo: FlameKindling,
  description: "webchat sederhana",
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRooms: RoomWithParticipantsDTO[];
  user: {
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

export function AppSidebar({ user, checkRole, userRooms, ...props }: AppSidebarProps) {
  const dynamicGroups = userRooms.map((room) => ({
  id: room.id,
  name: room.name,
  url: `/channels/${room.id}`,
  icon: Hash, 
}));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavBrand brand={brand} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={dynamicGroups} type="Channels" />
        {/* <NavMain groups={users} type="Users" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} checkRole={checkRole} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
