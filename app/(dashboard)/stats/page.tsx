"use client"

import { useState, useEffect } from "react"
import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  CheckCircle2, 
  Calendar, 
  StickyNote, 
  Tag, 
  TrendingUp, 
  Target,
  AlertCircle,
} from "lucide-react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Cell, 
  Pie, 
  PieChart, 
  XAxis,
  Area,
  AreaChart,
  Sector
} from "recharts"
import { type PieSectorDataItem } from "recharts/types/polar/Pie"

interface Tag {
  id: string
  name: string
  color: string
  _count: {
    events: number
    notes: number
    todos: number
  }
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
  tags: Tag[]
}

interface Event {
  id: string
  title: string
  startTime: string
  endTime: string
  createdAt: string
  tags: Tag[]
}

interface Stats {
  todos: {
    total: number
    completed: number
    pending: number
    byPriority: { priority: string; count: number }[]
    byStatus: { name: string; value: number; fill: string }[]
    completionRate: number
    overdue: number
  }
  notes: {
    total: number
    byType: { type: string; count: number; fill: string }[]
  }
  events: {
    total: number
    upcoming: number
    thisWeek: number
  }
  tags: {
    total: number
    mostUsed: Tag[]
  }
  productivity: {
    todosCompletedThisWeek: number
    notesCreatedThisWeek: number
    eventsThisWeek: number
  }
  dailyActivity: {
    date: string
    completadas: number
    pendientes: number
    todo: number
    in_progress: number
    done: number
  }[]
}

const PRIORITY_COLORS = {
  alta: "#ef4444",
  media: "#f59e0b",
  baja: "#10b981",
}

const STATUS_COLORS = {
  todo: "#94a3b8",
  in_progress: "#3b82f6",
  done: "#22c55e",
}

const NOTE_TYPE_COLORS: Record<string, string> = {
  text: "#3b82f6",
  list: "#8b5cf6",
  drawing: "#ec4899",
  code: "#f59e0b",
  voice: "#10b981",
  image: "#06b6d4",
}

const areaChartConfig = {
  completadas: {
    label: "Completadas",
    color: "#22c55e",
  },
  pendientes: {
    label: "Pendientes",
    color: "#94a3b8",
  },
} satisfies ChartConfig

const barChartConfig = {
  value: {
    label: "Tareas",
  },
  todo: {
    label: "Por Hacer",
    color: STATUS_COLORS.todo,
  },
  in_progress: {
    label: "En Progreso",
    color: STATUS_COLORS.in_progress,
  },
  done: {
    label: "Completadas",
    color: STATUS_COLORS.done,
  },
} satisfies ChartConfig

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("90d")
  const [activeStatusChart, setActiveStatusChart] = useState<"todo" | "in_progress" | "done">("done")

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)

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
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // === TODOS STATS ===
      const completedTodos = todos.filter((t) => t.completed)
      const pendingTodos = todos.filter((t) => !t.completed)
      const overdueTodos = pendingTodos.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now
      )

      const priorityCounts = {
        alta: todos.filter((t) => t.priority === "alta").length,
        media: todos.filter((t) => t.priority === "media").length,
        baja: todos.filter((t) => t.priority === "baja").length,
      }

      const byPriority = [
        { priority: "Alta", count: priorityCounts.alta },
        { priority: "Media", count: priorityCounts.media },
        { priority: "Baja", count: priorityCounts.baja },
      ]

      const statusCounts = {
        todo: todos.filter((t) => t.status === "todo").length,
        in_progress: todos.filter((t) => t.status === "in_progress").length,
        done: todos.filter((t) => t.status === "done").length,
      }

      const byStatus = [
        { name: "Por Hacer", value: statusCounts.todo, fill: STATUS_COLORS.todo },
        { name: "En Progreso", value: statusCounts.in_progress, fill: STATUS_COLORS.in_progress },
        { name: "Completadas", value: statusCounts.done, fill: STATUS_COLORS.done },
      ]

      const todosCompletedThisWeek = todos.filter(
        (t) => t.completed && new Date(t.createdAt) > weekAgo
      ).length

      // Generar datos diarios para los últimos 90 días
      const dailyActivity = []
      for (let i = 89; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)
        
        const dayTodos = todos.filter((t) => {
          const createdDate = new Date(t.createdAt)
          return createdDate >= date && createdDate < nextDate
        })
        
        dailyActivity.push({
          date: date.toISOString().split('T')[0],
          completadas: dayTodos.filter(t => t.completed).length,
          pendientes: dayTodos.filter(t => !t.completed).length,
          todo: dayTodos.filter(t => t.status === "todo").length,
          in_progress: dayTodos.filter(t => t.status === "in_progress").length,
          done: dayTodos.filter(t => t.status === "done").length,
        })
      }

      // === NOTES STATS ===
      const noteTypes = notes.reduce((acc, note) => {
        acc[note.type] = (acc[note.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const byType = Object.entries(noteTypes).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count,
        fill: NOTE_TYPE_COLORS[type] || "#6b7280",
      }))

      const notesCreatedThisWeek = notes.filter(
        (n) => new Date(n.createdAt) > weekAgo
      ).length

      // === EVENTS STATS ===
      const upcomingEvents = events.filter((e) => new Date(e.startTime) > now)
      const eventsThisWeek = events.filter((e) => {
        const eventDate = new Date(e.startTime)
        return eventDate > weekAgo && eventDate <= now
      }).length

      // === TAGS STATS ===
      const sortedTags = [...tags]
        .sort((a, b) => {
          const aTotal = a._count.todos + a._count.notes + a._count.events
          const bTotal = b._count.todos + b._count.notes + b._count.events
          return bTotal - aTotal
        })
        .slice(0, 5)

      setStats({
        todos: {
          total: todos.length,
          completed: completedTodos.length,
          pending: pendingTodos.length,
          byPriority,
          byStatus,
          completionRate: todos.length > 0 ? (completedTodos.length / todos.length) * 100 : 0,
          overdue: overdueTodos.length,
        },
        notes: {
          total: notes.length,
          byType,
        },
        events: {
          total: events.length,
          upcoming: upcomingEvents.length,
          thisWeek: eventsThisWeek,
        },
        tags: {
          total: tags.length,
          mostUsed: sortedTags,
        },
        productivity: {
          todosCompletedThisWeek,
          notesCreatedThisWeek,
          eventsThisWeek,
        },
        dailyActivity,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivityData = React.useMemo(() => {
    if (!stats) return []
    
    const data = stats.dailyActivity
    let daysToShow = 90
    if (timeRange === "30d") daysToShow = 30
    else if (timeRange === "7d") daysToShow = 7
    
    return data.slice(-daysToShow)
  }, [stats, timeRange])

  const statusTotals = React.useMemo(() => {
    if (!stats) return { todo: 0, in_progress: 0, done: 0 }
    
    return {
      todo: stats.dailyActivity.reduce((acc, curr) => acc + curr.todo, 0),
      in_progress: stats.dailyActivity.reduce((acc, curr) => acc + curr.in_progress, 0),
      done: stats.dailyActivity.reduce((acc, curr) => acc + curr.done, 0),
    }
  }, [stats])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
          <p className="text-muted-foreground">Análisis de tu productividad y actividad</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Error al cargar estadísticas</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
        <p className="text-muted-foreground">
          Análisis de tu productividad y actividad
        </p>
      </div>

      {/* Tarjetas de resumen rápido */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todos.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todos.completed} completadas, {stats.todos.pending} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Completado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todos.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.todos.overdue > 0 ? (
                <span className="text-destructive">{stats.todos.overdue} vencidas</span>
              ) : (
                "Sin tareas vencidas"
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notas</CardTitle>
            <StickyNote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.notes.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.productivity.notesCreatedThisWeek} esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Próximos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.events.upcoming}</div>
            <p className="text-xs text-muted-foreground">de {stats.events.total} totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid gap-4">
        {/* Tareas por día - Area Chart Interactivo */}
        <Card className="pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Tareas Creadas</CardTitle>
              <CardDescription>
                Completadas vs Pendientes en el tiempo
              </CardDescription>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="w-[160px] rounded-lg sm:ml-auto"
                aria-label="Seleccionar período"
              >
                <SelectValue placeholder="Últimos 3 meses" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="rounded-lg">
                  Últimos 3 meses
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  Últimos 30 días
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  Últimos 7 días
                </SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={areaChartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart data={filteredActivityData}>
                <defs>
                  <linearGradient id="fillCompletadas" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-completadas)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-completadas)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillPendientes" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-pendientes)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-pendientes)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("es-ES", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("es-ES", {
                          month: "long",
                          day: "numeric",
                        })
                      }}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="pendientes"
                  type="natural"
                  fill="url(#fillPendientes)"
                  stroke="var(--color-pendientes)"
                  stackId="a"
                />
                <Area
                  dataKey="completadas"
                  type="natural"
                  fill="url(#fillCompletadas)"
                  stroke="var(--color-completadas)"
                  stackId="a"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Estado de tareas - Bar Chart Interactivo */}
        <Card className="py-0">
          <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-6">
              <CardTitle>Estado de Tareas</CardTitle>
              <CardDescription>
                Distribución de tareas por estado
              </CardDescription>
            </div>
            <div className="flex">
              {(["todo", "in_progress", "done"] as const).map((status) => {
                return (
                  <button
                    key={status}
                    data-active={activeStatusChart === status}
                    className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                    onClick={() => setActiveStatusChart(status)}
                  >
                    <span className="text-muted-foreground text-xs">
                      {barChartConfig[status].label}
                    </span>
                    <span className="text-lg leading-none font-bold sm:text-3xl">
                      {statusTotals[status].toLocaleString()}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            <ChartContainer
              config={barChartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={filteredActivityData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("es-ES", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[150px]"
                      nameKey="value"
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("es-ES", {
                          month: "long",
                          day: "numeric",
                        })
                      }}
                    />
                  }
                />
                <Bar dataKey={activeStatusChart} fill={`var(--color-${activeStatusChart})`} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos secundarios */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Tareas por prioridad */}
        <Card>
          <CardHeader>
            <CardTitle>Tareas por Prioridad</CardTitle>
            <CardDescription>Distribución de tus tareas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={areaChartConfig}>
              <BarChart data={stats.todos.byPriority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#3b82f6">
                  {stats.todos.byPriority.map((entry, index) => {
                    let color = "#3b82f6"
                    if (entry.priority === "Alta") color = PRIORITY_COLORS.alta
                    else if (entry.priority === "Media") color = PRIORITY_COLORS.media
                    else if (entry.priority === "Baja") color = PRIORITY_COLORS.baja
                    return <Cell key={`cell-${index}`} fill={color} />
                  })}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Notas por tipo */}
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Distribución de Notas</CardTitle>
            <CardDescription>Por tipo de nota</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer config={areaChartConfig} className="mx-auto aspect-square max-h-[300px]">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={stats.notes.byType}
                  dataKey="count"
                  nameKey="type"
                  innerRadius={60}
                  strokeWidth={5}
                  activeIndex={0}
                  activeShape={({
                    outerRadius = 0,
                    ...props
                  }: PieSectorDataItem) => (
                    <Sector {...props} outerRadius={outerRadius + 10} />
                  )}
                >
                  {stats.notes.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 leading-none font-medium">
              Total de {stats.notes.total} notas creadas
            </div>
            <div className="text-muted-foreground leading-none">
              {stats.productivity.notesCreatedThisWeek} notas esta semana
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Actividad semanal y Tags más usados */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad de Esta Semana</CardTitle>
            <CardDescription>Tu productividad en los últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Tareas Completadas</span>
              </div>
              <Badge variant="secondary">{stats.productivity.todosCompletedThisWeek}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Notas Creadas</span>
              </div>
              <Badge variant="secondary">{stats.productivity.notesCreatedThisWeek}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium">Eventos Esta Semana</span>
              </div>
              <Badge variant="secondary">{stats.productivity.eventsThisWeek}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tags Más Usados</CardTitle>
            <CardDescription>Tus {stats.tags.mostUsed.length} etiquetas principales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.tags.mostUsed.length > 0 ? (
              stats.tags.mostUsed.map((tag) => {
                const total = tag._count.todos + tag._count.notes + tag._count.events
                return (
                  <div key={tag.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-medium">{tag.name}</span>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{tag._count.todos} tareas</span>
                      <span>•</span>
                      <span>{tag._count.notes} notas</span>
                      <span>•</span>
                      <span>{tag._count.events} eventos</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay tags creados aún
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}