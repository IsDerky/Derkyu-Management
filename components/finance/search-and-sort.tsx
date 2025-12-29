"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

export type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "description-asc"

interface SearchAndSortProps {
  searchValue: string
  onSearchChange: (value: string) => void
  sortValue: SortOption
  onSortChange: (value: SortOption) => void
  sortOptions?: { value: SortOption; label: string }[]
}

const DEFAULT_SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date-desc", label: "Fecha (más reciente)" },
  { value: "date-asc", label: "Fecha (más antigua)" },
  { value: "amount-desc", label: "Monto (mayor a menor)" },
  { value: "amount-asc", label: "Monto (menor a mayor)" },
  { value: "description-asc", label: "Descripción (A-Z)" },
]

export function SearchAndSort({
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  sortOptions = DEFAULT_SORT_OPTIONS,
}: SearchAndSortProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por descripción..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={sortValue} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Ordenar por..." />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
