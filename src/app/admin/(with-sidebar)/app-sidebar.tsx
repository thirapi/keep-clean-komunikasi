"use client";

import * as React from "react";
import { User, Log } from "@phosphor-icons/react/dist/ssr";

import { NavBrand } from "@/app/(with-sidebar)/nav-brand";
import { NavMain } from "./nav-main";
import { NavUser } from "@/app/(with-sidebar)/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { getUserSession } from "@/app/auth.action";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import K from "@/components/icons/k";

const brand = {
  name: "Komunikasi",
  logo: K,
  description: "webchat sederhana",
};

const sidebarItems = [
  {
    id: "1",
    name: "Users",
    url: "/admin/users",
    icon: User,
  },
  {
    id: "2",
    name: "Log Login",
    url: "/admin/log",
    icon: Log,
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
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

export function AppSidebar({ user, checkRole, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <NavBrand brand={brand} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={sidebarItems} type="Channels" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} checkRole={checkRole} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
