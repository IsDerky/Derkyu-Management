"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Calendar, 
  CheckSquare, 
  StickyNote, 
  Tag, 
  TrendingUp, 
  Clock,
  AlertCircle,
  ArrowRight,
  Flame,
  Target,
  FileText,
  ListChecks,
  Palette,
  Code,
  Mic,
  Image as ImageIcon
} from "lucide-react"
import { format, isToday, isTomorrow, isPast, startOfDay } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface Tag {
  id: string
  name: string
  color: string
}

interface Todo {
  id: string
  title: string
  completed: boolean
  priority: string | null
  status: string
  dueDate: string | null
  createdAt: string
  tags: Tag[]
}

interface Note {
  id: string
  title: string
  type: string
  createdAt: string
  content: string
}

interface Event {
  id: string
  title: string
  startTime: string
  endTime: string
  location: string | null
  tags: Tag[]
}

interface DashboardStats {
  eventsToday: number
  eventsTomorrow: number
  pendingTodos: number
  overdueTodos: number
  completedThisWeek: number
  totalNotes: number
  totalTags: number
  completionRate: number
  streak: number
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [recentTodos, setRecentTodos] = useState<Todo[]>([])
  const [recentNotes, setRecentNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [todosRes, notesRes, eventsRes, tagsRes] = await Promise.all([
        fetch("/api/todos"),
        fetch("/api/notes"),
        fetch("/api/events"),
        fetch("/api/tags"),
      ])

      if (!todosRes.ok || !notesRes.ok || !eventsRes.ok || !tagsRes.ok) {
        throw new Error("Error al cargar datos")
      }

      const todos: Todo[] = await todosRes.json()
      const notes: Note[] = await notesRes.json()
      const events: Event[] = await eventsRes.json()
      const tags: Tag[] = await tagsRes.json()

      const now = new Date()
      const today = startOfDay(now)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Calculate stats
      const eventsToday = events.filter(e => isToday(new Date(e.startTime))).length
      const eventsTomorrow = events.filter(e => isTomorrow(new Date(e.startTime))).length
      
      const pendingTodos = todos.filter(t => !t.completed)
      const overdueTodos = pendingTodos.filter(t => 
        t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
      )
      
      const completedThisWeek = todos.filter(t => 
        t.completed && new Date(t.createdAt) > weekAgo
      ).length

      const completedTotal = todos.filter(t => t.completed).length
      const completionRate = todos.length > 0 ? (completedTotal / todos.length) * 100 : 0

      // Calculate streak (días consecutivos completando al menos 1 tarea)
      const streak = calculateStreak(todos)

      setStats({
        eventsToday,
        eventsTomorrow,
        pendingTodos: pendingTodos.length,
        overdueTodos: overdueTodos.length,
        completedThisWeek,
        totalNotes: notes.length,
        totalTags: tags.length,
        completionRate,
        streak
      })

      // Get upcoming events (next 5)
      const upcoming = events
        .filter(e => new Date(e.startTime) >= now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 5)
      setUpcomingEvents(upcoming)

      // Get recent todos (last 5 created, pending first)
      const recent = [...todos]
        .sort((a, b) => {
          // Prioritize pending over completed
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        .slice(0, 5)
      setRecentTodos(recent)

      // Get recent notes (last 4)
      const recentNotesList = [...notes]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4)
      setRecentNotes(recentNotesList)

    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStreak = (todos: Todo[]): number => {
    if (todos.length === 0) return 0

    const completedByDay = new Map<string, number>()
    
    todos.filter(t => t.completed).forEach(todo => {
      const day = format(new Date(todo.createdAt), 'yyyy-MM-dd')
      completedByDay.set(day, (completedByDay.get(day) || 0) + 1)
    })

    let streak = 0
    let currentDate = new Date()
    
    while (true) {
      const dateKey = format(currentDate, 'yyyy-MM-dd')
      if (completedByDay.has(dateKey) && completedByDay.get(dateKey)! > 0) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (streak === 0 && isToday(currentDate)) {
        // Si hoy no hay tareas completadas, revisar ayer
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  const formatEventTime = (event: Event) => {
    const start = new Date(event.startTime)
    const end = new Date(event.endTime)
    
    if (isToday(start)) {
      return `Hoy ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
    } else if (isTomorrow(start)) {
      return `Mañana ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
    } else {
      return format(start, "d 'de' MMMM, HH:mm", { locale: es })
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "alta": return "bg-red-500/10 text-red-500 border-red-500/20"
      case "media": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "baja": return "bg-green-500/10 text-green-500 border-green-500/20"
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getNoteIcon = (type: string) => {
    const iconMap = {
      text: FileText,
      list: ListChecks,
      drawing: Palette,
      code: Code,
      voice: Mic,
      image: ImageIcon
    }
    const Icon = iconMap[type as keyof typeof iconMap] || FileText
    return <Icon className="h-5 w-5 text-muted-foreground" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Cargando tu información...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido a tu sistema de gestión personal
          </p>
        </div>
        {stats && stats.streak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <Flame className="h-5 w-5 text-orange-500" />
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-500">{stats.streak}</div>
              <div className="text-xs text-muted-foreground">días de racha</div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.eventsToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.eventsTomorrow ? `${stats.eventsTomorrow} mañana` : 'eventos programados'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingTodos || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.overdueTodos ? (
                <span className="text-destructive font-medium">{stats.overdueTodos} vencidas</span>
              ) : (
                `${stats?.completedThisWeek || 0} completadas esta semana`
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notas</CardTitle>
            <StickyNote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalNotes || 0}</div>
            <p className="text-xs text-muted-foreground">notas guardadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Completado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completionRate.toFixed(0) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedThisWeek || 0} completadas esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Próximos Eventos</CardTitle>
              <CardDescription>Tus eventos más cercanos</CardDescription>
            </div>
            <Link href="/calendar">
              <Button variant="ghost" size="sm">
                Ver todo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No hay eventos próximos</p>
                <Link href="/calendar">
                  <Button variant="link" size="sm" className="mt-2">
                    Crear evento
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{event.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatEventTime(event)}
                      </div>
                      {event.location && (
                        <p className="text-xs text-muted-foreground">📍 {event.location}</p>
                      )}
                      {event.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {event.tags.map(tag => (
                            <span
                              key={tag.id}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Todos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tareas Recientes</CardTitle>
              <CardDescription>Últimas tareas agregadas</CardDescription>
            </div>
            <Link href="/todos">
              <Button variant="ghost" size="sm">
                Ver todo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentTodos.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No hay tareas recientes</p>
                <Link href="/todos">
                  <Button variant="link" size="sm" className="mt-2">
                    Crear tarea
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors ${
                      todo.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center ${
                      todo.completed ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
                    }`}>
                      {todo.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className={`text-sm font-medium leading-none ${
                        todo.completed ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {todo.title}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {todo.priority && (
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(todo.priority)}`}>
                            {todo.priority}
                          </Badge>
                        )}
                        {todo.dueDate && (
                          <span className={`text-xs ${
                            !todo.completed && isPast(new Date(todo.dueDate)) && !isToday(new Date(todo.dueDate))
                              ? 'text-destructive font-medium'
                              : 'text-muted-foreground'
                          }`}>
                            {isToday(new Date(todo.dueDate))
                              ? 'Vence hoy'
                              : isTomorrow(new Date(todo.dueDate))
                              ? 'Vence mañana'
                              : format(new Date(todo.dueDate), "d 'de' MMM", { locale: es })
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Notes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Notas Recientes</CardTitle>
            <CardDescription>Tus últimas notas creadas</CardDescription>
          </div>
          <Link href="/notes">
            <Button variant="ghost" size="sm">
              Ver todo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentNotes.length === 0 ? (
            <div className="text-center py-8">
              <StickyNote className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No hay notas recientes</p>
              <Link href="/notes">
                <Button variant="link" size="sm" className="mt-2">
                  Crear nota
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recentNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3 mb-2">
                    {getNoteIcon(note.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{note.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(note.createdAt), "d 'de' MMM", { locale: es })}
                      </p>
                    </div>
                  </div>
                  {note.type === 'text' && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                      {note.content.substring(0, 100)}...
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {stats && stats.overdueTodos > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Tareas Vencidas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Tienes <span className="font-bold">{stats.overdueTodos}</span> tarea{stats.overdueTodos > 1 ? 's' : ''} vencida{stats.overdueTodos > 1 ? 's' : ''}.
            </p>
            <Link href="/todos">
              <Button variant="destructive" size="sm" className="mt-3">
                Ver tareas vencidas
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}