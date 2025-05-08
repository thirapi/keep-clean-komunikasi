"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

type Brand = {
  name: string
  logo: React.ElementType
  description: string
}

export function NavBrand({ brand }: { brand: Brand }) {

  return (
    <SidebarMenu>
      <SidebarMenuItem>
            <Link href="/app">
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <brand.logo className="size-6" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-xl font-bold text-prime tracking-wide">
                  {brand.name}
                </span>
                <span className="truncate text-xs dark:text-slate-500">{brand.description}</span>
              </div>
            </SidebarMenuButton>
            </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
