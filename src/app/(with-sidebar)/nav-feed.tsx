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
import { Globe, Users, Bookmark, Bell, User, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { getUnreadNotificationsCountAction } from "./notifications/notifications.action";

export function NavFeed({ userName }: { userName?: string }) {
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            const res = await getUnreadNotificationsCountAction();
            if (res.status === "success") {
                setUnreadCount(res.data || 0);
            }
        };
        fetchUnread();
        
        // Polling as a backup, or we can rely on router.refresh() from RealtimeNotificationListener
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [pathname]); // Refresh when navigating back to/from notifications

    const pulseItems = [
        {
            name: "Timeline",
            url: "/timeline",
            icon: Home,
        },
        {
            name: "Following",
            url: "/following",
            icon: Users,
        },
        {
            name: "Notifications",
            url: "/notifications",
            icon: Bell,
            count: unreadCount
        },
        {
            name: "Bookmark",
            url: "/bookmarks",
            icon: Bookmark,
        },
        {
            name: "Profile",
            url: userName ? `/profile/${userName}` : "/signin",
            icon: User,
        },
    ];

    return (
        <SidebarGroup>
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
                                    "transition-all duration-200 ease-in-out h-10 px-3 rounded-xl",
                                    isActive
                                        ? "bg-primary/10 text-primary font-bold hover:bg-primary/15"
                                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                )}
                            >
                                <Link href={item.url} className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3.5">
                                        <item.icon 
                                            className={cn("size-5 transition-transform", isActive && "scale-105")} 
                                            strokeWidth={isActive ? 2.5 : 2}
                                        />
                                        <span className="text-[14px]">{item.name}</span>
                                    </div>
                                    {item.count ? item.count > 0 && (
                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums ring-2 ring-background">
                                            {item.count > 99 ? '99+' : item.count}
                                        </span>
                                    ) : null}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}