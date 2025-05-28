"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

type Groups = {
  id: string;
  name: string;
  url: string;
  icon: React.ElementType;
  hasUnread: boolean | null;
};

export function NavMain({ groups, type }: { groups: Groups[]; type: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{type}</SidebarGroupLabel>
      <SidebarMenu>
        {[...groups].map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild tooltip={item.name}>
              <Link href={item.url}>
                <item.icon />
                <span>{item.name}</span>
                {item.hasUnread && (
                  <div className="ml-auto relative">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
                    <div className="absolute inset-0 h-2 w-2 bg-red-400 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-0.5 h-1 w-1 bg-red-300 rounded-full"></div>
                  </div>
                )}
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
