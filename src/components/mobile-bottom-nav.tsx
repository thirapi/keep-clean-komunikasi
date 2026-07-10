"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { UserIcon, UsersThreeIcon, ChatCircleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import React from "react";

const tabsCss = `
@keyframes tab-bounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.18); }
  55% { transform: scale(0.9); }
  80% { transform: scale(1.04); }
  100% { transform: scale(1); }
}
.tab-bounce {
  animation: tab-bounce 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
`;

interface MobileBottomNavProps {
  user: { username: string } | null;
}

const tabs = [
  { id: "channels" as const, href: "/channels/default?tab=channels", icon: UsersThreeIcon, label: "Channels" },
  { id: "dms" as const, href: "/channels/default?tab=dms", icon: ChatCircleIcon, label: "Messages" },
];

export function MobileBottomNav({ user }: MobileBottomNavProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevActiveRef = React.useRef<string>("");
  const [bounceKey, setBounceKey] = React.useState(0);

  const isDefaultRoute = pathname === "/channels/default" || pathname === "/channels";
  const isProfile = pathname.startsWith("/profile/");
  const tabFromUrl = searchParams.get("tab");
  const activeTab = isProfile ? "profile" : (tabFromUrl || (isDefaultRoute ? "channels" : ""));

  React.useEffect(() => {
    if (prevActiveRef.current && prevActiveRef.current !== activeTab) {
      setBounceKey((k) => k + 1);
    }
    prevActiveRef.current = activeTab;
  }, [activeTab]);

  const isInRoom = !isDefaultRoute && !isProfile;

  if (!isMobile || isInRoom) return null;

  return (
    <>
      <style>{tabsCss}</style>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-3 pointer-events-none">
        <div className="inline-flex items-center gap-0.5 p-1.5 rounded-full bg-background/70 backdrop-blur-2xl border border-border/20 shadow-2xl pointer-events-auto">
          {tabs.map(({ id, href, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <Link
                key={id}
                href={href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 px-5 py-2 rounded-full transition-all duration-200 select-none",
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground/50 hover:text-foreground/80",
                )}
                style={{ minWidth: 56 }}
              >
                <div className={cn(isActive && bounceKey > 0 && "tab-bounce")} key={isActive ? bounceKey : undefined}>
                  <Icon
                    className="h-5 w-5"
                    weight={isActive ? "bold" : "duotone"}
                  />
                </div>
                <span className={cn(
                  "text-[10px] leading-none",
                  isActive ? "font-semibold" : "font-medium",
                )}>
                  {label}
                </span>
              </Link>
            );
          })}

          <Link
            href={user ? `/profile/${user.username}` : "/"}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 px-5 py-2 rounded-full transition-all duration-200 select-none",
              activeTab === "profile"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground/50 hover:text-foreground/80",
            )}
            style={{ minWidth: 56 }}
          >
            <div className={cn(activeTab === "profile" && bounceKey > 0 && "tab-bounce")} key={activeTab === "profile" ? bounceKey : undefined}>
              <UserIcon
                className="h-5 w-5"
                weight={activeTab === "profile" ? "bold" : "duotone"}
              />
            </div>
            <span className={cn(
              "text-[10px] leading-none",
              activeTab === "profile" ? "font-semibold" : "font-medium",
            )}>
              {user ? "Profile" : "Login"}
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}
