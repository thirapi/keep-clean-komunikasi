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

export function NavFeed() {
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
            {/* <SidebarGroupLabel className="px-2 text-xs font-semibold text-sidebar-foreground/50">
                Feed
            </SidebarGroupLabel> */}
            
            {/* gap-1 memberikan ruang bernapas antar item navigasi */}
            <SidebarMenu className="gap-1">
                {pulseItems.map((item) => {
                    const isActive = pathname === item.url;

                    return (
                        <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton
                                asChild
                                tooltip={item.name}
                                isActive={isActive}
                                className={cn(
                                    "transition-all duration-200 ease-in-out h-10 px-3 rounded-xl JSON",
                                    // Style ketika aktif vs tidak aktif khas microblog modern
                                    isActive
                                        ? "bg-primary/10 text-primary font-bold hover:bg-primary/15"
                                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                )}
                            >
                                <Link href={item.url} className="flex items-center gap-3.5 w-full">
                                    {/* Menaikkan ukuran ikon ke size-5 dan menebal saat aktif */}
                                    <item.icon 
                                        className={cn("size-5 transition-transform", isActive && "scale-105")} 
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                    {/* Sedikit menyesuaikan ukuran teks agar pas dengan ikon */}
                                    <span className="text-[14px]">{item.name}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}