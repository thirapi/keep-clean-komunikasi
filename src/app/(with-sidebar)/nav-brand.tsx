"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Brand = {
  name: string;
  logo: React.ElementType;
  description: string;
};

export function NavBrand({ brand }: { brand: Brand }) {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";
  return (
    <SidebarMenu>
      <SidebarMenuItem
        className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between gap-2"
          }`}
      >
        {isCollapsed ? (
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-0 group-hover:pointer-events-none">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-10 items-center justify-center rounded-lg">
                <brand.logo className="size-6" />
              </div>
            </div>

            {!isMobile && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarTrigger className="flex items-center justify-center size-10 rounded-lg" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Buka sidebar</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/channels/default" className="flex-1">
              <SidebarMenuButton
                size="lg"
                className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <brand.logo className="size-6" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate text-xl font-bold text-prime tracking-wide">
                    {brand.name}
                  </span>
                  <span className="truncate text-xs dark:text-slate-500">
                    {brand.description}
                  </span>
                </div>
              </SidebarMenuButton>
            </Link>

            {!isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Tutup sidebar</p>
                </TooltipContent>
              </Tooltip>
            )}
          </>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
