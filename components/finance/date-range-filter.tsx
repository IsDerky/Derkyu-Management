"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, X } from "lucide-react"
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns"
import { es } from "date-fns/locale"

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const PRESETS = [
  { label: "Hoy", getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: "Últimos 7 días", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Este mes", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Mes pasado", getValue: () => ({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(subMonths(new Date(), 1))
  }) },
  { label: "Últimos 3 meses", getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
  { label: "Este año", getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
]

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handlePresetClick = (getValue: () => DateRange) => {
    onChange(getValue())
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange({ from: undefined, to: undefined })
  }

  const formatRange = () => {
    if (!value.from) return "Filtrar por fecha"
    if (!value.to) return format(value.from, "dd MMM yyyy", { locale: es })
    if (value.from.getTime() === value.to.getTime()) {
      return format(value.from, "dd MMM yyyy", { locale: es })
    }
    return `${format(value.from, "dd MMM", { locale: es })} - ${format(value.to, "dd MMM yyyy", { locale: es })}`
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets */}
            <div className="border-r p-3 space-y-1">
              <div className="text-sm font-medium mb-2">Rápido</div>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={() => handlePresetClick(preset.getValue)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Calendars */}
            <div className="p-3">
              <div className="text-sm font-medium mb-2">Personalizado</div>
              <div className="flex gap-2">
                <Calendar
                  mode="range"
                  selected={{ from: value.from, to: value.to }}
                  onSelect={(range) => onChange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  locale={es}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => setIsOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {value.from && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
