"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TimePickerProps {
  value?: string
  onChange?: (time: string) => void
  placeholder?: string
  disabled?: boolean
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Seleccionar hora",
  disabled = false,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Generate hour and minute options
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

  const [selectedHour, setSelectedHour] = React.useState<string>(
    value ? value.split(':')[0] : '09'
  )
  const [selectedMinute, setSelectedMinute] = React.useState<string>(
    value ? value.split(':')[1] : '00'
  )

  // Sync external value changes
  React.useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':')
      setSelectedHour(hour)
      setSelectedMinute(minute)
    }
  }, [value])

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour)
    const newTime = `${hour}:${selectedMinute}`
    if (onChange) {
      onChange(newTime)
    }
  }

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute)
    const newTime = `${selectedHour}:${minute}`
    if (onChange) {
      onChange(newTime)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <ScrollArea className="h-[200px]">
            <div className="flex flex-col p-2">
              {hours.map((hour) => (
                <Button
                  key={hour}
                  variant={selectedHour === hour ? "default" : "ghost"}
                  className="h-8 w-16 justify-center"
                  onClick={() => handleHourSelect(hour)}
                >
                  {hour}
                </Button>
              ))}
            </div>
          </ScrollArea>
          <div className="border-l" />
          <ScrollArea className="h-[200px]">
            <div className="flex flex-col p-2">
              {minutes.map((minute) => (
                <Button
                  key={minute}
                  variant={selectedMinute === minute ? "default" : "ghost"}
                  className="h-8 w-16 justify-center"
                  onClick={() => handleMinuteSelect(minute)}
                >
                  {minute}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
