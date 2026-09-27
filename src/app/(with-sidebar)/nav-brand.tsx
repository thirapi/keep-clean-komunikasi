"use client";

import * as React from "react";
import {
  SidebarMenu,
  SidebarMenuItem,
  // SidebarTrigger,
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
  /** BrandLogo, or any component taking a numeric `size` prop. */
  logo: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
};

export function NavBrand({ brand }: { brand: Brand }) {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenu>
      <SidebarMenuItem
        className={`flex items-center ${
          isCollapsed ? "justify-center" : "justify-between gap-2"
        }`}
      >
        {isCollapsed ? (
          <div className="relative group flex items-center justify-center size-12">
            <div className="absolute flex items-center justify-center transition-opacity group-hover:opacity-0 group-hover:pointer-events-none">
              <brand.logo size={40} />
            </div>

            {!isMobile && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                {/* 
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarTrigger className="flex items-center justify-center size-12 rounded-lg" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Buka sidebar</p>
                  </TooltipContent>
                </Tooltip> 
                */}
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/channels/default" className="flex-1">
              <div className="flex items-center gap-1 w-full p-2 rounded-lg group transition-colors">

                <div className="flex items-center gap-1 w-full group-hover:scale-[1.03] origin-left">
                  <div className="flex items-center justify-center shrink-0">
                    <brand.logo size={32} />
                  </div>

                  <div className="flex items-center flex-1 text-left">
                    <span
                      className="text-3xl font-brand font-[550] text-prime tracking-tight leading-none"
                      style={{
                        transform: "skewX(-7deg)",
                        display: "inline-block",
                      }}
                    >
                      {brand.name}
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {!isMobile &&
              /* 
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Tutup sidebar</p>
                </TooltipContent>
              </Tooltip> 
              */
              null}
          </>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
