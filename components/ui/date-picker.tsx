"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate && onChange) {
      // Format as YYYY-MM-DD
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      onChange(formattedDate)
    }
  }

  // Sync external value changes
  React.useEffect(() => {
    if (value) {
      setDate(new Date(value))
    }
  }, [value])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: es }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
