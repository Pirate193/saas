"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    // This wrapper styles the component to look like a single, joined control
    <div className="flex items-center w-full justify-center space-x-1 rounded-md bg-muted/60 p-1">
      <Button
        // Set variant="secondary" if this is the active theme
        variant={theme === "light" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setTheme("light")}
        // These classes make it fit the container
        className="flex-1 text-xs h-7"
      >
        Light
      </Button>
      <Button
        variant={theme === "dark" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setTheme("dark")}
        className="flex-1 text-xs h-7"
      >
        Dark
      </Button>
      <Button
        variant={theme === "system" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setTheme("system")}
        className="flex-1 text-xs h-7"
      >
        System
      </Button>
    </div>
  )
}