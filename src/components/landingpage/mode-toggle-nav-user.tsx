"use client"

import { Moon, Sun } from "@phosphor-icons/react/dist/ssr"
import { useTheme } from "next-themes"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function ModeToggleItem() {
  const { setTheme, theme } = useTheme()

  const nextTheme = theme === "dark" ? "light" : "dark"

  return (
    <DropdownMenuItem
      onClick={() => setTheme(nextTheme)}
      className="flex items-center gap-2"
    >
      {theme === "dark" ? (
        <Sun weight="duotone" className="h-4 w-4" />
      ) : (
        <Moon weight="duotone" className="h-4 w-4" />
      )}
      <span>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
    </DropdownMenuItem>
  )
}
