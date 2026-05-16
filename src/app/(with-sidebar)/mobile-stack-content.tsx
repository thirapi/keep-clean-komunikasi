"use client";

import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/**
 * MobileStackContent visually hides the SidebarInset (the Chat Room) entirely 
 * on mobile devices if the user is currently at the /channels/default route.
 * This is the "Detail" side of the Master-Detail stack.
 */
export function MobileStackContent({ children }: { children: React.ReactNode }) {
    const isMobile = useIsMobile();
    const pathname = usePathname();
    const isDefaultRoom = pathname === "/channels/default" || pathname === "/channels";

    return (
        <div className={cn(
            "flex flex-col flex-1 min-h-0 w-full overflow-hidden",
            isDefaultRoom && "max-md:hidden"
        )}>
            {children}
        </div>
    );
}
