"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MoreVertical, Trash2, Edit, Hash, Loader2, Calendar, FileText, CheckSquare } from "lucide-react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
  _count?: {
    events: number
    notes: number
    todos: number
  }
}

const colorOptions = [
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#10b981" },
  { name: "Rojo", value: "#ef4444" },
  { name: "Morado", value: "#8b5cf6" },
  { name: "Amarillo", value: "#f59e0b" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Cian", value: "#06b6d4" },
  { name: "Naranja", value: "#f97316" },
  { name: "Índigo", value: "#6366f1" },
  { name: "Lima", value: "#84cc16" },
  { name: "Esmeralda", value: "#059669" },
  { name: "Ámbar", value: "#d97706" },
]

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    color: colorOptions[0].value
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tags')
      
      if (!response.ok) {
        throw new Error('Error al cargar tags')
      }

      const data = await response.json()
      setTags(data)
    } catch (error) {
      console.error('Error fetching tags:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las etiquetas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear etiqueta')
      }

      const newTag = await response.json()
      setTags([...tags, newTag])
      
      toast({
        title: "Éxito",
        description: "Etiqueta creada exitosamente"
      })

      setFormData({ name: "", color: colorOptions[0].value })
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Error creating tag:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear la etiqueta",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingTag) return

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar etiqueta')
      }

      const updatedTag = await response.json()
      setTags(tags.map(t => t.id === updatedTag.id ? updatedTag : t))
      
      toast({
        title: "Éxito",
        description: "Etiqueta actualizada exitosamente"
      })

      setIsEditDialogOpen(false)
      setEditingTag(null)
      setFormData({ name: "", color: colorOptions[0].value })
    } catch (error) {
      console.error('Error updating tag:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar la etiqueta",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta etiqueta? Se desvinculará de todos los elementos asociados.')) {
      return
    }

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar etiqueta')
      }

      setTags(tags.filter(t => t.id !== tagId))
      
      toast({
        title: "Éxito",
        description: "Etiqueta eliminada exitosamente"
      })
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la etiqueta",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      color: tag.color
    })
    setIsEditDialogOpen(true)
  }

  const totalUsage = tags.reduce((acc, tag) => {
    return acc + (tag._count?.events || 0) + (tag._count?.notes || 0) + (tag._count?.todos || 0)
  }, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">
            Organiza tus eventos, notas y tareas con etiquetas
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateTag}>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Tag</DialogTitle>
                <DialogDescription>
                  Agrega una nueva etiqueta para organizar tus contenidos
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="tag-name">Nombre *</Label>
                  <Input
                    id="tag-name"
                    placeholder="ej: trabajo, personal"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Color</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`h-10 rounded-md border-2 transition-all ${
                          formData.color === color.value
                            ? "border-foreground scale-110 ring-2 ring-offset-2"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-2 rounded-lg border p-3 bg-muted/50">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Vista previa:</span>
                  <Badge style={{ backgroundColor: formData.color, color: "white", borderColor: formData.color }}>
                    {formData.name || "nuevo-tag"}
                  </Badge>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Tag"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Usos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.reduce((acc, tag) => acc + (tag._count?.events || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En Tareas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.reduce((acc, tag) => acc + (tag._count?.todos || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de tags */}
      {tags.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Hash className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No tienes tags aún</p>
            <p className="text-muted-foreground mb-4">
              Crea tu primer tag para empezar a organizar tus contenidos
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Crear Primer Tag
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tags.map((tag) => {
            const totalCount = (tag._count?.events || 0) + (tag._count?.notes || 0) + (tag._count?.todos || 0)
            
            return (
              <Card key={tag.id} className="hover:shadow-lg transition-shadow group">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="h-4 w-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <CardTitle className="text-lg truncate">#{tag.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(tag)}>
                          <Edit className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTag(tag.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Usos totales</span>
                      <span className="text-2xl font-bold">{totalCount}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>Eventos</span>
                        </div>
                        <span className="font-medium">{tag._count?.events || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span>Notas</span>
                        </div>
                        <span className="font-medium">{tag._count?.notes || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-3 w-3 text-muted-foreground" />
                          <span>Tareas</span>
                        </div>
                        <span className="font-medium">{tag._count?.todos || 0}</span>
                      </div>
                    </div>
                    
                    <Badge
                      style={{
                        backgroundColor: tag.color,
                        color: "white",
                        borderColor: tag.color
                      }}
                      className="w-full justify-center"
                    >
                      {tag.name}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de Edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdateTag}>
            <DialogHeader>
              <DialogTitle>Editar Tag</DialogTitle>
              <DialogDescription>
                Modifica los detalles de la etiqueta
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-tag-name">Nombre *</Label>
                <Input
                  id="edit-tag-name"
                  placeholder="ej: trabajo, personal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`h-10 rounded-md border-2 transition-all ${
                        formData.color === color.value
                          ? "border-foreground scale-110 ring-2 ring-offset-2"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-2 rounded-lg border p-3 bg-muted/50">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Vista previa:</span>
                <Badge style={{ backgroundColor: formData.color, color: "white", borderColor: formData.color }}>
                  {formData.name || "tag"}
                </Badge>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}