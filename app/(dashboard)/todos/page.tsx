"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Trash2,
  Edit,
  MoreVertical,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
  Circle,
  Filter,
  SortAsc,
  ListTodo,
  X,
  GripVertical,
  LayoutGrid
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Tag {
  id: string
  name: string
  color: string
}

interface Subtask {
  id?: string
  title: string
  completed: boolean
  order?: number
}

interface Todo {
  id: string
  title: string
  description: string | null
  completed: boolean
  priority: string | null
  status: "todo" | "in_progress" | "done"
  dueDate: string | null
  tags: Tag[]
  subtasks: Subtask[]
  createdAt: string
  updatedAt: string
}

const STATUS_CONFIG = {
  todo: { label: "Por Hacer", color: "bg-slate-500" },
  in_progress: { label: "En Progreso", color: "bg-blue-500" },
  done: { label: "Completado", color: "bg-green-500" }
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list")

  // Filtros
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all")
  const [filterPriority, setFilterPriority] = useState<"all" | "alta" | "media" | "baja">("all")
  const [sortBy, setSortBy] = useState<"date" | "priority" | "created">("date")

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "media" as "alta" | "media" | "baja",
    status: "todo" as "todo" | "in_progress" | "done",
    dueDate: undefined as Date | undefined,
    tagIds: [] as string[],
    subtasks: [] as Subtask[]
  })

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")

  const { toast } = useToast()

  useEffect(() => {
    fetchTodos()
    fetchTags()
  }, [])

  const fetchTodos = async () => {
    try {
      const response = await fetch("/api/todos")
      if (!response.ok) throw new Error("Error al cargar tareas")
      const data = await response.json()
      setTodos(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags")
      if (!response.ok) throw new Error("Error al cargar tags")
      const data = await response.json()
      setTags(data)
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "El título es requerido",
        variant: "destructive"
      })
      return
    }

    try {
      const url = editingTodo ? `/api/todos/${editingTodo.id}` : "/api/todos"
      const method = editingTodo ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          status: formData.status,
          dueDate: formData.dueDate?.toISOString(),
          tagIds: formData.tagIds,
          subtasks: formData.subtasks
        })
      })

      if (!response.ok) throw new Error("Error al guardar tarea")

      toast({
        title: "Éxito",
        description: editingTodo ? "Tarea actualizada" : "Tarea creada"
      })

      setIsDialogOpen(false)
      resetForm()
      fetchTodos()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la tarea",
        variant: "destructive"
      })
    }
  }

  const toggleComplete = async (todo: Todo) => {
    try {
      const newCompleted = !todo.completed
      const newStatus = newCompleted ? "done" : "todo"

      const response = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: newCompleted,
          status: newStatus
        })
      })

      if (!response.ok) throw new Error("Error al actualizar tarea")
      fetchTodos()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea",
        variant: "destructive"
      })
    }
  }

  const updateTodoStatus = async (todoId: string, newStatus: "todo" | "in_progress" | "done") => {
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error("Error al actualizar estado")
      fetchTodos()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      })
    }
  }

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed })
      })

      if (!response.ok) throw new Error("Error al actualizar subtarea")
      fetchTodos()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la subtarea",
        variant: "destructive"
      })
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Error al eliminar tarea")

      toast({
        title: "Éxito",
        description: "Tarea eliminada"
      })
      fetchTodos()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "media",
      status: "todo",
      dueDate: undefined,
      tagIds: [],
      subtasks: []
    })
    setNewSubtaskTitle("")
    setEditingTodo(null)
  }

  const openEditDialog = (todo: Todo) => {
    setEditingTodo(todo)
    setFormData({
      title: todo.title,
      description: todo.description || "",
      priority: (todo.priority as "alta" | "media" | "baja") || "media",
      status: todo.status,
      dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
      tagIds: todo.tags.map(t => t.id),
      subtasks: todo.subtasks || []
    })
    setIsDialogOpen(true)
  }

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return

    setFormData({
      ...formData,
      subtasks: [
        ...formData.subtasks,
        { title: newSubtaskTitle, completed: false }
      ]
    })
    setNewSubtaskTitle("")
  }

  const removeSubtask = (index: number) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.filter((_, i) => i !== index)
    })
  }

  const toggleFormSubtask = (index: number) => {
    const updated = [...formData.subtasks]
    updated[index].completed = !updated[index].completed
    setFormData({ ...formData, subtasks: updated })
  }

  const toggleTagSelection = (tagId: string) => {
    setFormData({
      ...formData,
      tagIds: formData.tagIds.includes(tagId)
        ? formData.tagIds.filter(id => id !== tagId)
        : [...formData.tagIds, tagId]
    })
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "alta": return "destructive"
      case "media": return "default"
      case "baja": return "secondary"
      default: return "outline"
    }
  }

  const getPriorityIcon = (priority: string | null) => {
    switch (priority) {
      case "alta": return <AlertCircle className="h-4 w-4" />
      case "media": return <Circle className="h-4 w-4" />
      case "baja": return <CheckCircle2 className="h-4 w-4" />
      default: return null
    }
  }

  const filteredTodos = todos.filter(todo => {
    if (filterStatus === "active" && todo.completed) return false
    if (filterStatus === "completed" && !todo.completed) return false
    if (filterPriority !== "all" && todo.priority !== filterPriority) return false
    return true
  }).sort((a, b) => {
    if (sortBy === "date") {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    if (sortBy === "priority") {
      const priorityOrder = { alta: 0, media: 1, baja: 2 }
      return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3) -
        (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3)
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const todosByStatus = {
    todo: filteredTodos.filter(t => t.status === "todo"),
    in_progress: filteredTodos.filter(t => t.status === "in_progress"),
    done: filteredTodos.filter(t => t.status === "done")
  }

  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
    overdue: todos.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length
  }

  const renderTodoCard = (todo: Todo, showStatus = false) => (
    <div
      key={todo.id}
      className="p-4 rounded-lg border bg-card hover:shadow-md transition-all"
      draggable={viewMode === "kanban"}
      onDragStart={(e) => {
        e.dataTransfer.setData("todoId", todo.id)
      }}
    >
      <div className="flex items-start gap-3">
        {viewMode === "kanban" && (
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move mt-1" />
        )}
        <Checkbox
          checked={todo.completed}
          onCheckedChange={() => toggleComplete(todo)}
          className="mt-1"
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-medium ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
              {todo.title}
            </p>
            {todo.priority && (
              <Badge variant={getPriorityColor(todo.priority)} className="gap-1">
                {getPriorityIcon(todo.priority)}
                {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
              </Badge>
            )}
            {showStatus && (
              <Badge className={STATUS_CONFIG[todo.status].color}>
                {STATUS_CONFIG[todo.status].label}
              </Badge>
            )}
          </div>

          {todo.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {todo.description}
            </p>
          )}

          {todo.subtasks && todo.subtasks.length > 0 && (
            <div className="space-y-1">
              {todo.subtasks.slice(0, 3).map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => toggleSubtask(subtask.id!, subtask.completed)}
                    className="h-3 w-3"
                  />
                  <span className={subtask.completed ? "line-through text-muted-foreground" : ""}>
                    {subtask.title}
                  </span>
                </div>
              ))}
              {todo.subtasks.length > 3 && (
                <p className="text-xs text-muted-foreground ml-5">
                  +{todo.subtasks.length - 3} más
                </p>
              )}
              <p className="text-xs text-muted-foreground ml-5">
                {todo.subtasks.filter(s => s.completed).length}/{todo.subtasks.length} completadas
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            {todo.dueDate && (
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                <span className={
                  !todo.completed && new Date(todo.dueDate) < new Date()
                    ? "text-destructive font-medium"
                    : ""
                }>
                  {format(new Date(todo.dueDate), "d 'de' MMMM", { locale: es })}
                </span>
              </div>
            )}
            {todo.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {todo.tags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    style={{ borderColor: tag.color }}
                    className="text-xs"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEditDialog(todo)}>
              <Edit className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => deleteTodo(todo.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
          <p className="text-muted-foreground">
            Gestiona tus tareas y pendientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <ListTodo className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("kanban")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Nueva Tarea
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingTodo ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
                  <DialogDescription>
                    {editingTodo ? "Modifica los detalles de la tarea" : "Crea una nueva tarea"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Nombre de la tarea"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Añade detalles sobre esta tarea..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Prioridad</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value: "alta" | "media" | "baja") =>
                          setFormData({ ...formData, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="baja">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Estado</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: "todo" | "in_progress" | "done") =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">Por Hacer</SelectItem>
                          <SelectItem value="in_progress">En Progreso</SelectItem>
                          <SelectItem value="done">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de vencimiento</Label>
                    <DatePicker
                      value={formData.dueDate?.toISOString()}
                      onChange={(dateString) => setFormData({ ...formData, dueDate: new Date(dateString) })}
                      placeholder="Seleccionar fecha"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Etiquetas</Label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant={formData.tagIds.includes(tag.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          style={formData.tagIds.includes(tag.id) ? { backgroundColor: tag.color } : { borderColor: tag.color }}
                          onClick={() => toggleTagSelection(tag.id)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                      {tags.length === 0 && (
                        <p className="text-sm text-muted-foreground">No hay etiquetas disponibles</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Subtareas</Label>
                    <div className="space-y-2">
                      {formData.subtasks.map((subtask, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Checkbox
                            checked={subtask.completed}
                            onCheckedChange={() => toggleFormSubtask(index)}
                          />
                          <Input
                            value={subtask.title}
                            onChange={(e) => {
                              const updated = [...formData.subtasks]
                              updated[index].title = e.target.value
                              setFormData({ ...formData, subtasks: updated })
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeSubtask(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          placeholder="Nueva subtarea..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addSubtask()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addSubtask}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingTodo ? "Guardar" : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {viewMode === "list" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mis Tareas</CardTitle>
                <CardDescription>
                  {filteredTodos.length} tarea{filteredTodos.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                      Filtrar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                      Todas
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("active")}>
                      Activas
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("completed")}>
                      Completadas
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <SortAsc className="h-4 w-4" />
                      Ordenar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setSortBy("date")}>
                      Por fecha
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("priority")}>
                      Por prioridad
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("created")}>
                      Por creación
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTodos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay tareas que mostrar
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTodos.map((todo) => renderTodoCard(todo, true))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(todosByStatus).map(([status, statusTodos]) => (
            <Card
              key={status}
              className="min-h-[400px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const todoId = e.dataTransfer.getData("todoId")
                if (todoId) {
                  updateTodoStatus(todoId, status as "todo" | "in_progress" | "done")
                }
              }}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].color}`} />
                  <CardTitle className="text-base">
                    {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}
                  </CardTitle>
                  <Badge variant="secondary">{statusTodos.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statusTodos.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Arrastra tareas aquí
                    </p>
                  ) : (
                    statusTodos.map((todo) => renderTodoCard(todo, false))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 