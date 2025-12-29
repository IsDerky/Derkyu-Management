"use client"

import { Button } from "@/components/ui/button"
import { List, LayoutGrid } from "lucide-react"

export type ViewMode = "list" | "cards"

interface ViewToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 border rounded-lg p-1">
      <Button
        variant={value === "list" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onChange("list")}
        className="h-8 px-3"
      >
        <List className="h-4 w-4 mr-1" />
        Lista
      </Button>
      <Button
        variant={value === "cards" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onChange("cards")}
        className="h-8 px-3"
      >
        <LayoutGrid className="h-4 w-4 mr-1" />
        Tarjetas
      </Button>
    </div>
  )
}
