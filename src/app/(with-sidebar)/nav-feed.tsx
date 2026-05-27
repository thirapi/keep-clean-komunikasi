"use client";

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Users, Bookmark, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function NavFeed({ onRemoteFollow }: { onRemoteFollow?: () => void }) {
    const pathname = usePathname();

    const pulseItems = [
        {
            name: "Global",
            url: "/timeline",
            icon: Globe,
        },
        {
            name: "Mengikuti",
            url: "/following",
            icon: Users,
        },
        {
            name: "Bookmark",
            url: "/bookmarks",
            icon: Bookmark,
        },
    ];

    return (
        <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-xs font-semibold text-sidebar-foreground/50 flex items-center justify-between">
                Feed
                {onRemoteFollow && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-primary transition-colors"
                                    onClick={onRemoteFollow}
                                >
                                    <SearchIcon className="size-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Cari Pengguna</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </SidebarGroupLabel>
            <SidebarMenu>
                {pulseItems.map((item) => {
                    const isActive = pathname === item.url;

                    return (
                        <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton
                                asChild
                                tooltip={item.name}
                                isActive={isActive}
                                className={cn(
                                    "transition-all duration-200",
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                        : "text-sidebar-foreground/70"
                                )}
                            >
                                <Link href={item.url} className="flex items-center gap-3">
                                    <item.icon className={cn("size-4", isActive && "text-primary")} />
                                    <span>{item.name}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
