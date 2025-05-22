"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { stringToColor } from "@/utils/background-avatar";
import Link from "next/link";

type Groups = {
  id: string;
  userId: string;
  name: string;
  url: string;
  icon: React.ElementType;
};

export function NavMainDirectMessage({
  groups,
  type,
}: {
  groups: Groups[];
  type: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{type}</SidebarGroupLabel>
      <SidebarMenu>
        {[...groups].map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              className="flex items-center gap-2"
              asChild
              tooltip={item.name}
            >
              <Link href={item.url} className="relative">
                <Avatar className="h-6 w-6 rounded-md">
                  <AvatarFallback className="text-xs rounded-md" style={{ backgroundColor: stringToColor(item.userId) }}>{item.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>@{item.name}</span>
              </Link>
            </SidebarMenuButton>
            {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction showOnHover>
                <MoreHorizontal />
                <span className="sr-only">More</span>
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 rounded-lg">
              <DropdownMenuItem>
                <Folder className="text-zinc-500 dark:text-zinc-400" />
                <span>View Project</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Forward className="text-zinc-500 dark:text-zinc-400" />
                <span>Share Project</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Trash2 className="text-zinc-500 dark:text-zinc-400" />
                <span>Delete Project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
