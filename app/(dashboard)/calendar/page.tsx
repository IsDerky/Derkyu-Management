"use client"

import React, { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock, MapPin, Loader2, Trash2, Pencil, Repeat, CalendarDays, LayoutGrid, Search, Filter, X, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Tag {
  id: string
  name: string
  color: string
}

interface Event {
  id: string
  title: string
  description?: string | null
  startTime: string
  endTime: string
  location?: string | null
  isRecurring: boolean
  recurrenceType?: string | null
  recurrenceEnd?: string | null
  tags: Tag[]
  userId: string
  createdAt: string
  updatedAt: string
}

type CalendarView = "day" | "week" | "month"

// Componente auxiliar para Badge con color personalizado
const ColoredBadge = ({ tag, variant = "secondary" }: { tag: Tag; variant?: "default" | "secondary" | "outline" }) => {
  return (
    <Badge 
      variant={variant}
      style={{
        backgroundColor: `${tag.color}20`,
        borderColor: tag.color,
        color: tag.color,
        borderWidth: '1px',
        borderStyle: 'solid'
      }}
    >
      {tag.name}
    </Badge>
  )
}

// Componente mejorado de TimePicker con input manual
const EnhancedTimePicker = ({ value, onChange }: { value: string; onChange: (time: string) => void }) => {
  const [hours, minutes] = value.split(':').map(Number)
  const [hourInput, setHourInput] = React.useState(hours.toString().padStart(2, '0'))
  const [minuteInput, setMinuteInput] = React.useState(minutes.toString().padStart(2, '0'))
  
  React.useEffect(() => {
    setHourInput(hours.toString().padStart(2, '0'))
  }, [hours])
  
  React.useEffect(() => {
    setMinuteInput(minutes.toString().padStart(2, '0'))
  }, [minutes])
  
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/\D/g, '') // Solo números
    
    if (inputValue === '') {
      setHourInput('00')
      onChange(`00:${minutes.toString().padStart(2, '0')}`)
      return
    }
    
    // Limitar a 2 dígitos
    if (inputValue.length > 2) {
      inputValue = inputValue.slice(-2)
    }
    
    let newHour = parseInt(inputValue)
    
    // Si es mayor a 23, tomar solo el último dígito
    if (newHour > 23) {
      inputValue = inputValue.slice(-1)
      newHour = parseInt(inputValue)
    }
    
    setHourInput(inputValue.padStart(2, '0'))
    onChange(`${inputValue.padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
  }
  
  const handleHourFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/\D/g, '') // Solo números
    
    if (inputValue === '') {
      setMinuteInput('00')
      onChange(`${hours.toString().padStart(2, '0')}:00`)
      return
    }
    
    // Limitar a 2 dígitos
    if (inputValue.length > 2) {
      inputValue = inputValue.slice(-2)
    }
    
    let newMinute = parseInt(inputValue)
    
    // Si es mayor a 59, tomar solo el último dígito
    if (newMinute > 59) {
      inputValue = inputValue.slice(-1)
      newMinute = parseInt(inputValue)
    }
    
    setMinuteInput(inputValue.padStart(2, '0'))
    onChange(`${hours.toString().padStart(2, '0')}:${inputValue.padStart(2, '0')}`)
  }
  
  const handleMinuteFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  const handleHourScroll = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -1 : 1
    let newHour = hours + delta
    
    // Hacer wrap-around
    if (newHour > 23) newHour = 0
    if (newHour < 0) newHour = 23
    
    onChange(`${newHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
  }

  const handleMinuteScroll = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -1 : 1
    let newMinute = minutes + delta
    
    // Hacer wrap-around
    if (newMinute > 59) newMinute = 0
    if (newMinute < 0) newMinute = 59
    
    onChange(`${hours.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={hourInput}
        onChange={handleHourChange}
        onFocus={handleHourFocus}
        onWheel={handleHourScroll}
        className="w-16 text-center"
        placeholder="00"
      />
      <span>:</span>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={minuteInput}
        onChange={handleMinuteChange}
        onFocus={handleMinuteFocus}
        onWheel={handleMinuteScroll}
        className="w-16 text-center"
        placeholder="00"
      />
    </div>
  )
}

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [view, setView] = useState<CalendarView>("day")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTagFilter, setSelectedTagFilter] = useState<string[]>([])
  const [conflicts, setConflicts] = useState<Event[]>([])
  const { toast } = useToast()

  // Form state para crear
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    isAllDay: false,
    recurrenceType: "never",
    recurrenceEnd: "",
    tagIds: [] as string[],
  })

  // Form state para editar
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    isAllDay: false,
    recurrenceType: "never",
    recurrenceEnd: "",
    tagIds: [] as string[],
  })

  useEffect(() => {
    fetchEvents()
    fetchTags()
  }, [])

  // Verificar conflictos cuando cambian las fechas/horas en el formulario de crear
  useEffect(() => {
    if (formData.date && formData.startTime && formData.endTime && !formData.isAllDay) {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`)
      const conflictingEvents = checkEventConflicts(startDateTime, endDateTime)
      setConflicts(conflictingEvents)
    } else {
      setConflicts([])
    }
  }, [formData.date, formData.startTime, formData.endTime, formData.isAllDay])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/events')

      if (!response.ok) {
        throw new Error('Error al cargar eventos')
      }

      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')

      if (!response.ok) {
        throw new Error('Error al cargar tags')
      }

      const data = await response.json()
      setTags(data)
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title) {
      toast({
        title: "Error",
        description: "El título es requerido",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`)

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location: formData.location || null,
          isRecurring: formData.recurrenceType !== 'never',
          recurrenceType: formData.recurrenceType !== 'never' ? formData.recurrenceType : null,
          recurrenceEnd: formData.recurrenceType !== 'never' && formData.recurrenceEnd ? new Date(formData.recurrenceEnd).toISOString() : null,
          tagIds: formData.tagIds,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear evento')
      }

      const result = await response.json()
      const newEvents = Array.isArray(result) ? result : [result]
      setEvents([...events, ...newEvents])

      toast({
        title: "Éxito",
        description: formData.recurrenceType !== 'never'
          ? `${newEvents.length} eventos recurrentes creados exitosamente`
          : "Evento creado exitosamente",
      })

      setFormData({
        title: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "10:00",
        location: "",
        isAllDay: false,
        recurrenceType: "never",
        recurrenceEnd: "",
        tagIds: [],
      })
      setCreateDialogOpen(false)
    } catch (error) {
      console.error('Error creating event:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el evento",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedEvent) return

    try {
      setSubmitting(true)

      const startDateTime = new Date(`${editFormData.date}T${editFormData.startTime}`)
      const endDateTime = new Date(`${editFormData.date}T${editFormData.endTime}`)

      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description || null,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location: editFormData.location || null,
          isRecurring: editFormData.recurrenceType !== 'never',
          recurrenceType: editFormData.recurrenceType !== 'never' ? editFormData.recurrenceType : null,
          recurrenceEnd: editFormData.recurrenceType !== 'never' && editFormData.recurrenceEnd ? new Date(editFormData.recurrenceEnd).toISOString() : null,
          tagIds: editFormData.tagIds,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar evento')
      }

      const updatedEvent = await response.json()
      setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e))

      toast({
        title: "Éxito",
        description: "Evento actualizado exitosamente",
      })

      setEditDialogOpen(false)
      setDetailDialogOpen(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error('Error updating event:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el evento",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar evento')
      }

      setEvents(events.filter(e => e.id !== eventId))

      toast({
        title: "Éxito",
        description: "Evento eliminado exitosamente",
      })

      setDetailDialogOpen(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error('Error deleting event:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento",
        variant: "destructive",
      })
    }
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    const startDate = new Date(event.startTime)
    const endDate = new Date(event.endTime)

    // Formatear la fecha en zona horaria local para evitar problemas de offset
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    setEditFormData({
      title: event.title,
      description: event.description || "",
      date: formatLocalDate(startDate),
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: endDate.toTimeString().slice(0, 5),
      location: event.location || "",
      isAllDay: false,
      recurrenceType: event.isRecurring && event.recurrenceType ? event.recurrenceType : "never",
      recurrenceEnd: event.recurrenceEnd ? formatLocalDate(new Date(event.recurrenceEnd)) : "",
      tagIds: event.tags.map(tag => tag.id),
    })

    setDetailDialogOpen(true)
  }

  const handleEditClick = () => {
    setDetailDialogOpen(false)
    setEditDialogOpen(true)
  }

  // Filtrar eventos por búsqueda y tags
  const filteredEvents = events.filter((event) => {
    const matchesSearch = !searchQuery ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTags = selectedTagFilter.length === 0 ||
      event.tags.some(tag => selectedTagFilter.includes(tag.id))

    return matchesSearch && matchesTags
  })

  const eventsForSelectedDate = filteredEvents.filter((event) => {
    const eventDate = new Date(event.startTime)
    return eventDate.toDateString() === date?.toDateString()
  })

  const daysWithEvents = new Set(
    filteredEvents.map(event => new Date(event.startTime).toDateString())
  )

  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getEventPosition = (event: Event) => {
    const start = new Date(event.startTime)
    const end = new Date(event.endTime)

    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const endMinutes = end.getHours() * 60 + end.getMinutes()
    const duration = endMinutes - startMinutes

    // Calcular la posición basada en el total de minutos del día (1440)
    const top = (startMinutes / 1440) * 100
    const height = (duration / 1440) * 100

    return {
      top,
      height,
      startMinutes,
      endMinutes,
    }
  }

  // Función para detectar eventos que se solapan y calcular su posición horizontal
  const getEventLayout = (currentEvent: Event, allEvents: Event[]) => {
    const current = getEventPosition(currentEvent)
    
    // Encontrar todos los eventos que se solapan con el actual
    const overlappingEvents = allEvents.filter(event => {
      if (event.id === currentEvent.id) return true
      const pos = getEventPosition(event)
      return (
        (current.startMinutes >= pos.startMinutes && current.startMinutes < pos.endMinutes) ||
        (current.endMinutes > pos.startMinutes && current.endMinutes <= pos.endMinutes) ||
        (current.startMinutes <= pos.startMinutes && current.endMinutes >= pos.endMinutes)
      )
    })

    // Ordenar eventos solapados por hora de inicio
    overlappingEvents.sort((a, b) => {
      const aPos = getEventPosition(a)
      const bPos = getEventPosition(b)
      return aPos.startMinutes - bPos.startMinutes
    })

    const totalOverlapping = overlappingEvents.length
    const currentIndex = overlappingEvents.findIndex(e => e.id === currentEvent.id)

    return {
      width: 100 / totalOverlapping,
      left: (100 / totalOverlapping) * currentIndex,
      totalOverlapping
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const getWeekDays = (date: Date) => {
    const weekStart = getWeekStart(date)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return d
    })
  }

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)

    const firstDayOfWeek = firstDay.getDay()
    const startDate = new Date(firstDay)
    startDate.setDate(1 - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1))

    const days = []
    const currentDate = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }

  const getEventsForDate = (targetDate: Date) => {
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.startTime)
      return eventDate.toDateString() === targetDate.toDateString()
    })
  }

  const getEventsForDateRange = (startDate: Date, endDate: Date) => {
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.startTime)
      return eventDate >= startDate && eventDate <= new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1)
    })
  }

  const checkEventConflicts = (startTime: Date, endTime: Date, excludeEventId?: string) => {
    return events.filter((event) => {
      if (excludeEventId && event.id === excludeEventId) return false

      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)

      return (
        (startTime >= eventStart && startTime < eventEnd) ||
        (endTime > eventStart && endTime <= eventEnd) ||
        (startTime <= eventStart && endTime >= eventEnd)
      )
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (!date) return
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setDate(newDate)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (!date) return
    const newDate = new Date(date)
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    setDate(newDate)
  }

  const goToToday = () => {
    setDate(new Date())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
          <p className="text-muted-foreground">
            Gestiona tus eventos y reuniones
          </p>
        </div>

        <div className="flex items-center gap-4">
          <ToggleGroup type="single" value={view} onValueChange={(value: string) => value && setView(value as CalendarView)}>
            <ToggleGroupItem value="day" aria-label="Vista diaria">
              <Clock className="h-4 w-4 mr-2" />
              Día
            </ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="Vista semanal">
              <CalendarDays className="h-4 w-4 mr-2" />
              Semana
            </ToggleGroupItem>
            <ToggleGroupItem value="month" aria-label="Vista mensual">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Mes
            </ToggleGroupItem>
          </ToggleGroup>

          <Dialog open={createDialogOpen} onOpenChange={(open) => {
            if (open && date) {
              const year = date.getFullYear()
              const month = String(date.getMonth() + 1).padStart(2, '0')
              const day = String(date.getDate()).padStart(2, '0')
              const localDate = `${year}-${month}-${day}`

              setFormData(prev => ({
                ...prev,
                date: localDate
              }))
            }
            setCreateDialogOpen(open)
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <form onSubmit={handleCreateEvent}>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Evento</DialogTitle>
                  <DialogDescription>
                    Agrega un nuevo evento a tu calendario
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      placeholder="Reunión de equipo"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      placeholder="Detalles del evento..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Fecha *</Label>
                    <DatePicker
                      value={formData.date}
                      onChange={(date) => setFormData({ ...formData, date })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-day"
                      checked={formData.isAllDay}
                      onCheckedChange={(checked) => {
                        if (checked === true) {
                          setFormData({
                            ...formData,
                            isAllDay: true,
                            startTime: "00:00",
                            endTime: "23:59"
                          })
                        } else {
                          setFormData({
                            ...formData,
                            isAllDay: false,
                            startTime: "09:00",
                            endTime: "10:00"
                          })
                        }
                      }}
                    />
                    <Label htmlFor="all-day" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Todo el día
                    </Label>
                  </div>
                  {!formData.isAllDay && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="start-time">Hora inicio *</Label>
                        <EnhancedTimePicker
                          value={formData.startTime}
                          onChange={(time) => setFormData({ ...formData, startTime: time })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="end-time">Hora fin *</Label>
                        <EnhancedTimePicker
                          value={formData.endTime}
                          onChange={(time) => setFormData({ ...formData, endTime: time })}
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Input
                      id="location"
                      placeholder="Sala de conferencias"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <Separator />

                  <div className="grid gap-2">
                    <Label>Etiquetas</Label>
                    <div className="flex flex-wrap gap-2">
                      {tags.length > 0 ? (
                        tags.map((tag) => (
                          <div key={tag.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`tag-${tag.id}`}
                              checked={formData.tagIds.includes(tag.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({ ...formData, tagIds: [...formData.tagIds, tag.id] })
                                } else {
                                  setFormData({ ...formData, tagIds: formData.tagIds.filter(id => id !== tag.id) })
                                }
                              }}
                            />
                            <Label
                              htmlFor={`tag-${tag.id}`}
                              className="text-sm font-normal cursor-pointer flex items-center gap-1"
                            >
                              <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: tag.color }}
                              />
                              {tag.name}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No hay etiquetas disponibles</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-2">
                    <Label htmlFor="recurrence-type">Repetir</Label>
                    <Select
                      value={formData.recurrenceType}
                      onValueChange={(value) => setFormData({ ...formData, recurrenceType: value })}
                    >
                      <SelectTrigger id="recurrence-type" className="w-full">
                        <SelectValue placeholder="Selecciona frecuencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Nunca</SelectItem>
                        <SelectItem value="daily">Cada día</SelectItem>
                        <SelectItem value="weekdays">Cada día laborable (Lun-Vie)</SelectItem>
                        <SelectItem value="weekly">Cada semana</SelectItem>
                        <SelectItem value="monthly">Cada mes</SelectItem>
                        <SelectItem value="yearly">Cada año</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.recurrenceType !== 'never' && (
                    <div className="grid gap-2">
                      <Label htmlFor="recurrence-end">Finalizar repetición</Label>
                      <DatePicker
                        value={formData.recurrenceEnd}
                        onChange={(date) => setFormData({ ...formData, recurrenceEnd: date })}
                        placeholder="Seleccionar fecha de fin"
                      />
                      <p className="text-xs text-muted-foreground">
                        Opcional: Deja en blanco para repetir indefinidamente
                      </p>
                    </div>
                  )}

                  {conflicts.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Conflicto de horario detectado</AlertTitle>
                      <AlertDescription>
                        Este evento se solapa con {conflicts.length} evento{conflicts.length > 1 ? 's' : ''} existente{conflicts.length > 1 ? 's' : ''}:
                        <ul className="mt-2 list-disc list-inside">
                          {conflicts.slice(0, 3).map((event) => (
                            <li key={event.id} className="text-sm">
                              {event.title} ({formatTime(event.startTime)} - {formatTime(event.endTime)})
                            </li>
                          ))}
                          {conflicts.length > 3 && (
                            <li className="text-sm">Y {conflicts.length - 3} más...</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Evento"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  {formatDate(selectedEvent.startTime)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Horario</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                    </p>
                  </div>
                </div>

                {selectedEvent.location && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Ubicación</p>
                        <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>
                      </div>
                    </div>
                  </>
                )}

                {selectedEvent.isRecurring && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <Repeat className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Recurrencia</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedEvent.recurrenceType === 'daily' && 'Cada día'}
                          {selectedEvent.recurrenceType === 'weekdays' && 'Cada día laborable (Lun-Vie)'}
                          {selectedEvent.recurrenceType === 'weekly' && 'Cada semana'}
                          {selectedEvent.recurrenceType === 'monthly' && 'Cada mes'}
                          {selectedEvent.recurrenceType === 'yearly' && 'Cada año'}
                          {selectedEvent.recurrenceEnd && (
                            <> hasta el {formatDate(selectedEvent.recurrenceEnd)}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {selectedEvent.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Descripción</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedEvent.description}
                      </p>
                    </div>
                  </>
                )}

                {selectedEvent.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Etiquetas</p>
                      <div className="flex gap-2 flex-wrap">
                        {selectedEvent.tags.map((tag) => (
                          <ColoredBadge key={tag.id} tag={tag} />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter className="flex gap-2 sm:gap-0">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="flex-1 sm:flex-none"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
                <Button onClick={handleEditClick} className="flex-1 sm:flex-none">
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          {selectedEvent && (
            <form onSubmit={handleUpdateEvent}>
              <DialogHeader>
                <DialogTitle>Editar Evento</DialogTitle>
                <DialogDescription>
                  Modifica la información del evento
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Título *</Label>
                  <Input
                    id="edit-title"
                    placeholder="Reunión de equipo"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Descripción</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Detalles del evento..."
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-date">Fecha *</Label>
                  <DatePicker
                    value={editFormData.date}
                    onChange={(date) => setEditFormData({ ...editFormData, date })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-all-day"
                    checked={editFormData.isAllDay}
                    onCheckedChange={(checked) => {
                      if (checked === true) {
                        setEditFormData({
                          ...editFormData,
                          isAllDay: true,
                          startTime: "00:00",
                          endTime: "23:59"
                        })
                      } else {
                        setEditFormData({
                          ...editFormData,
                          isAllDay: false,
                          startTime: "09:00",
                          endTime: "10:00"
                        })
                      }
                    }}
                  />
                  <Label htmlFor="edit-all-day" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Todo el día
                  </Label>
                </div>
                {!editFormData.isAllDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-start-time">Hora inicio *</Label>
                      <EnhancedTimePicker
                        value={editFormData.startTime}
                        onChange={(time) => setEditFormData({ ...editFormData, startTime: time })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-end-time">Hora fin *</Label>
                      <EnhancedTimePicker
                        value={editFormData.endTime}
                        onChange={(time) => setEditFormData({ ...editFormData, endTime: time })}
                      />
                    </div>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="edit-location">Ubicación</Label>
                  <Input
                    id="edit-location"
                    placeholder="Sala de conferencias"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  />
                </div>

                <Separator />

                <div className="grid gap-2">
                  <Label>Etiquetas</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.length > 0 ? (
                      tags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-tag-${tag.id}`}
                            checked={editFormData.tagIds.includes(tag.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEditFormData({ ...editFormData, tagIds: [...editFormData.tagIds, tag.id] })
                              } else {
                                setEditFormData({ ...editFormData, tagIds: editFormData.tagIds.filter(id => id !== tag.id) })
                              }
                            }}
                          />
                          <Label
                            htmlFor={`edit-tag-${tag.id}`}
                            className="text-sm font-normal cursor-pointer flex items-center gap-1"
                          >
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay etiquetas disponibles</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid gap-2">
                  <Label htmlFor="edit-recurrence-type">Repetir</Label>
                  <Select
                    value={editFormData.recurrenceType}
                    onValueChange={(value) => setEditFormData({ ...editFormData, recurrenceType: value })}
                  >
                    <SelectTrigger id="edit-recurrence-type" className="w-full">
                      <SelectValue placeholder="Selecciona frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Nunca</SelectItem>
                      <SelectItem value="daily">Cada día</SelectItem>
                      <SelectItem value="weekdays">Cada día laborable (Lun-Vie)</SelectItem>
                      <SelectItem value="weekly">Cada semana</SelectItem>
                      <SelectItem value="monthly">Cada mes</SelectItem>
                      <SelectItem value="yearly">Cada año</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editFormData.recurrenceType !== 'never' && (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-recurrence-end">Finalizar repetición</Label>
                    <DatePicker
                      value={editFormData.recurrenceEnd}
                      onChange={(date) => setEditFormData({ ...editFormData, recurrenceEnd: date })}
                      placeholder="Seleccionar fecha de fin"
                    />
                    <p className="text-xs text-muted-foreground">
                      Opcional: Deja en blanco para repetir indefinidamente
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos por título, descripción o ubicación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {tags.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                    {selectedTagFilter.length > 0 && (
                      <Badge variant="secondary" className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center">
                        {selectedTagFilter.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-3">Filtrar por etiquetas</h4>
                      <div className="space-y-2">
                        {tags.map((tag) => (
                          <div key={tag.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`filter-tag-${tag.id}`}
                              checked={selectedTagFilter.includes(tag.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTagFilter([...selectedTagFilter, tag.id])
                                } else {
                                  setSelectedTagFilter(selectedTagFilter.filter(id => id !== tag.id))
                                }
                              }}
                            />
                            <Label
                              htmlFor={`filter-tag-${tag.id}`}
                              className="text-sm font-normal cursor-pointer flex items-center gap-2 flex-1"
                            >
                              <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: tag.color }}
                              />
                              {tag.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedTagFilter.length > 0 && (
                      <>
                        <Separator />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setSelectedTagFilter([])}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Limpiar filtros
                        </Button>
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {(searchQuery || selectedTagFilter.length > 0) && (
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredEvents.length} de {events.length} eventos
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {view === "day" && (
          <Card className="h-fit">
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                weekStartsOn={1}
                className="rounded-md"
                modifiers={{
                  hasEvents: (day) => daysWithEvents.has(day.toDateString())
                }}
                modifiersClassNames={{
                  hasEvents: "bg-primary/20 font-bold"
                }}
              />
            </CardContent>
          </Card>
        )}

        <Card className={view === "day" ? "" : "lg:col-span-2"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle>
                  {view === "day" && date?.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {view === "week" && date && `Semana del ${getWeekStart(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                  {view === "month" && date?.toLocaleDateString('es-ES', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </CardTitle>
                <CardDescription>
                  {loading ? (
                    "Cargando..."
                  ) : view === "day" && eventsForSelectedDate.length > 0 ? (
                    `${eventsForSelectedDate.length} evento(s) programado(s)`
                  ) : view === "day" ? (
                    "No hay eventos para este día"
                  ) : view === "week" && date ? (
                    `${getEventsForDateRange(getWeekStart(date), new Date(getWeekStart(date).getTime() + 6 * 24 * 60 * 60 * 1000)).length} evento(s) esta semana`
                  ) : view === "month" && date ? (
                    `${getEventsForDateRange(new Date(date.getFullYear(), date.getMonth(), 1), new Date(date.getFullYear(), date.getMonth() + 1, 0)).length} evento(s) este mes`
                  ) : (
                    ""
                  )}
                </CardDescription>
              </div>

              {(view === "week" || view === "month") && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                  >
                    Hoy
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => view === "week" ? navigateWeek('prev') : navigateMonth('prev')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => view === "week" ? navigateWeek('next') : navigateMonth('next')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : view === "day" ? (
              <div className="relative">
                <div className="flex">
                  <div className="w-16 flex-shrink-0">
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="h-16 flex items-start justify-end pr-2 text-xs text-muted-foreground border-t first:border-t-0"
                      >
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 relative border-l">
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="h-16 border-t first:border-t-0"
                      />
                    ))}

                    {eventsForSelectedDate.map((event) => {
                      const position = getEventPosition(event)
                      const layout = getEventLayout(event, eventsForSelectedDate)
                      const eventColor = event.tags.length > 0 ? event.tags[0].color : '#ffffff'
                      
                      // Cada hora tiene 64px de altura (h-16)
                      // Un minuto = 64px / 60 = 1.0667px
                      const pixelsPerMinute = 64 / 60
                      const topPx = position.startMinutes * pixelsPerMinute
                      const durationPx = (position.endMinutes - position.startMinutes) * pixelsPerMinute
                      
                      // Restar padding (p-2 = 0.5rem = 8px top + 8px bottom = 16px) + borde (4px)
                      const adjustedHeightPx = Math.max(durationPx - 4, 36) // Restar solo el borde, mínimo 36px
                      
                      return (
                        <div
                          key={event.id}
                          className="absolute group cursor-pointer"
                          style={{
                            top: `${topPx}px`,
                            height: `${durationPx}px`,
                            left: `calc(0.25rem + ${layout.left}%)`,
                            width: `calc(${layout.width}% - 0.5rem)`,
                          }}
                          onClick={() => handleEventClick(event)}
                        >
                          <div
                            className="h-full rounded-r-md p-2 hover:opacity-90 transition-opacity overflow-hidden box-border"
                            style={{
                              backgroundColor: `${eventColor}15`,
                              borderLeft: `4px solid ${eventColor}`,
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">
                                  {event.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                  </span>
                                </div>
                                {event.location && durationPx > 60 && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                )}
                                {event.tags.length > 0 && durationPx > 80 && layout.totalOverlapping === 1 && (
                                  <div className="flex gap-1 mt-2 flex-wrap">
                                    {event.tags.map((tag) => (
                                      <ColoredBadge key={tag.id} tag={tag} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {eventsForSelectedDate.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <p>No hay eventos programados para este día</p>
                          <p className="text-sm mt-2">Haz clic en "Nuevo Evento" para agregar uno</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : view === "week" && date ? (
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  <div className="flex border-b">
                    <div className="w-16 flex-shrink-0"></div>
                    {getWeekDays(date).map((day) => (
                      <div key={day.toISOString()} className="flex-1 text-center py-2 border-l">
                        <div className="text-xs text-muted-foreground">
                          {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                        </div>
                        <div className={`text-sm font-medium ${day.toDateString() === new Date().toDateString() ? 'text-primary' : ''}`}>
                          {day.getDate()}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex relative" style={{ height: '1536px' }}>
                    <div className="w-16 flex-shrink-0">
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className="h-16 flex items-start justify-end pr-2 text-xs text-muted-foreground border-t first:border-t-0"
                        >
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                      ))}
                    </div>
                    {getWeekDays(date).map((day) => {
                      const dayEvents = getEventsForDate(day)
                      return (
                        <div key={day.toISOString()} className="flex-1 relative border-l">
                          {hours.map((hour) => (
                            <div
                              key={hour}
                              className="h-16 border-t first:border-t-0"
                            />
                          ))}
                          {dayEvents.map((event) => {
                            const position = getEventPosition(event)
                            const eventColor = event.tags.length > 0 ? event.tags[0].color : '#ffffff'
                            
                            return (
                              <div
                                key={event.id}
                                className="absolute left-0.5 right-0.5 cursor-pointer"
                                style={{
                                  top: `${position.top}%`,
                                  height: `${position.height}%`,
                                  minHeight: '32px',
                                }}
                                onClick={() => handleEventClick(event)}
                              >
                                <div
                                  className="h-full rounded-r p-1 hover:opacity-90 transition-opacity overflow-hidden"
                                  style={{
                                    backgroundColor: `${eventColor}15`,
                                    borderLeft: `2px solid ${eventColor}`,
                                  }}
                                >
                                  <div className="text-xs font-semibold truncate">{event.title}</div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {formatTime(event.startTime)}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : view === "month" && date ? (
              <div className="overflow-auto">
                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                    <div key={day} className="bg-muted p-2 text-center text-xs font-medium">
                      {day}
                    </div>
                  ))}
                  {getMonthDays(date).map((day) => {
                    const dayEvents = getEventsForDate(day)
                    const isCurrentMonth = day.getMonth() === date.getMonth()
                    const isToday = day.toDateString() === new Date().toDateString()
                    return (
                      <div
                        key={day.toISOString()}
                        className={`bg-card p-2 min-h-[100px] cursor-pointer hover:bg-accent/50 transition-colors ${!isCurrentMonth ? 'opacity-40' : ''}`}
                        onClick={() => {
                          setDate(day)
                          setView("day")
                        }}
                      >
                        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => {
                            const eventColor = event.tags.length > 0 ? event.tags[0].color : '#ffffff'
                            
                            return (
                              <div
                                key={event.id}
                                className="text-xs p-1 rounded-r truncate"
                                style={{
                                  backgroundColor: `${eventColor}20`,
                                  borderLeft: `2px solid ${eventColor}`,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEventClick(event)
                                }}
                              >
                                {event.title}
                              </div>
                            )
                          })}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 3} más
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}