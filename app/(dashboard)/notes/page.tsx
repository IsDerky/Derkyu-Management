"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, MoreVertical, Trash2, Edit, Loader2, X, Filter, FileText, ListChecks, Palette, Code, Mic, Image as ImageIcon } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ListNoteEditor } from "@/components/note-types/list-note-editor"
import { ListNoteViewer } from "@/components/note-types/list-note-viewer"
import { DrawingNoteEditor } from "@/components/note-types/drawing-note-editor"
import { DrawingNoteViewer } from "@/components/note-types/drawing-note-viewer"
import { CodeNoteEditor } from "@/components/note-types/code-note-editor"
import { CodeNoteViewer } from "@/components/note-types/code-note-viewer"
import { VoiceNoteEditor } from "@/components/note-types/voice-note-editor"
import { VoiceNoteViewer } from "@/components/note-types/voice-note-viewer"
import { ImageNoteEditor } from "@/components/note-types/image-note-editor"
import { ImageNoteViewer } from "@/components/note-types/image-note-viewer"
import { TextNoteViewer } from "@/components/note-types/text-note-viewer"

interface Tag {
  id: string
  name: string
  color: string
}

interface Note {
  id: string
  title: string
  content: string
  type: string
  tags: Tag[]
  userId: string
  createdAt: string
  updatedAt: string
}

type NoteType = "text" | "list" | "drawing" | "code" | "voice" | "image"

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTagFilter, setSelectedTagFilter] = useState<string[]>([])
  const { toast } = useToast()

  // Form state para crear
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "text" as NoteType,
    tagIds: [] as string[],
  })

  // Form state para editar
  const [editFormData, setEditFormData] = useState({
    title: "",
    content: "",
    type: "text" as NoteType,
    tagIds: [] as string[],
  })

  useEffect(() => {
    fetchNotes()
    fetchTags()
  }, [])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notes')

      if (!response.ok) {
        throw new Error('Error al cargar notas')
      }

      const data = await response.json()
      setNotes(data)
    } catch (error) {
      console.error('Error fetching notes:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las notas",
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

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Error al crear nota')
      }

      const newNote = await response.json()
      setNotes([newNote, ...notes])
      setCreateDialogOpen(false)
      setFormData({
        title: "",
        content: "",
        type: "text",
        tagIds: [],
      })

      toast({
        title: "Nota creada",
        description: "La nota se ha creado exitosamente",
      })
    } catch (error) {
      console.error('Error creating note:', error)
      toast({
        title: "Error",
        description: "No se pudo crear la nota",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedNote) return

    setSubmitting(true)

    try {
      const response = await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar nota')
      }

      const updatedNote = await response.json()
      setNotes(notes.map(note => note.id === updatedNote.id ? updatedNote : note))
      setEditDialogOpen(false)
      setSelectedNote(null)

      toast({
        title: "Nota actualizada",
        description: "La nota se ha actualizado exitosamente",
      })
    } catch (error) {
      console.error('Error updating note:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la nota",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      return
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar nota')
      }

      setNotes(notes.filter(note => note.id !== noteId))

      toast({
        title: "Nota eliminada",
        description: "La nota se ha eliminado exitosamente",
      })
    } catch (error) {
      console.error('Error deleting note:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la nota",
        variant: "destructive",
      })
    }
  }

  const handleEditClick = (note: Note) => {
    setSelectedNote(note)
    setEditFormData({
      title: note.title,
      content: note.content,
      type: note.type as NoteType,
      tagIds: note.tags.map(tag => tag.id),
    })
    setEditDialogOpen(true)
  }

  const handleUpdateNoteContent = async (noteId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar nota')
      }

      const updatedNote = await response.json()
      setNotes(notes.map(note => note.id === updatedNote.id ? updatedNote : note))
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  // Filtrar notas por búsqueda y tags
  const filteredNotes = notes.filter((note) => {
    // Filtro de búsqueda (solo en título)
    const matchesSearch = !searchQuery ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase())

    // Filtro de tags
    const matchesTags = selectedTagFilter.length === 0 ||
      note.tags.some(tag => selectedTagFilter.includes(tag.id))

    return matchesSearch && matchesTags
  })

  const getNoteIcon = (type: string) => {
    switch (type) {
      case "list":
        return <ListChecks className="h-4 w-4" />
      case "drawing":
        return <Palette className="h-4 w-4" />
      case "code":
        return <Code className="h-4 w-4" />
      case "voice":
        return <Mic className="h-4 w-4" />
      case "image":
        return <ImageIcon className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getNoteTypeLabel = (type: string) => {
    switch (type) {
      case "list":
        return "Lista"
      case "drawing":
        return "Dibujo"
      case "code":
        return "Código"
      case "voice":
        return "Audio"
      case "image":
        return "Imagen"
      default:
        return "Texto"
    }
  }

  const renderNoteContent = (note: Note) => {
    switch (note.type) {
      case "list":
        return <ListNoteViewer content={note.content} onUpdate={(newContent) => handleUpdateNoteContent(note.id, newContent)} />
      case "drawing":
        return <DrawingNoteViewer content={note.content} />
      case "code":
        return <CodeNoteViewer content={note.content} />
      case "voice":
        return <VoiceNoteViewer content={note.content} />
      case "image":
        return <ImageNoteViewer content={note.content} />
      default:
        return <TextNoteViewer content={note.content} />
    }
  }

  const renderNoteEditor = (type: NoteType, value: string, onChange: (value: string) => void) => {
    switch (type) {
      case "list":
        return <ListNoteEditor value={value} onChange={onChange} />
      case "drawing":
        return <DrawingNoteEditor value={value} onChange={onChange} />
      case "code":
        return <CodeNoteEditor value={value} onChange={onChange} />
      case "voice":
        return <VoiceNoteEditor value={value} onChange={onChange} />
      case "image":
        return <ImageNoteEditor value={value} onChange={onChange} />
      default:
        return (
          <Textarea
            placeholder="Escribe tu nota aquí... (Soporta Markdown)"
            rows={10}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notas</h1>
          <p className="text-muted-foreground">
            Guarda tus ideas y pensamientos
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Nota
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateNote}>
              <DialogHeader>
                <DialogTitle>Crear Nueva Nota</DialogTitle>
                <DialogDescription>
                  Escribe tu nota aquí
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Selector de tipo */}
                <div className="grid gap-2">
                  <Label>Tipo de nota</Label>
                  <ToggleGroup
                    type="single"
                    value={formData.type}
                    onValueChange={(value: string) => {
                      if (value) {
                        setFormData({ ...formData, type: value as NoteType, content: "" })
                      }
                    }}
                    className="justify-start flex-wrap"
                  >
                    <ToggleGroupItem value="text" aria-label="Nota de texto">
                      <FileText className="h-4 w-4 mr-2" />
                      Texto
                    </ToggleGroupItem>
                    <ToggleGroupItem value="list" aria-label="Lista">
                      <ListChecks className="h-4 w-4 mr-2" />
                      Lista
                    </ToggleGroupItem>
                    <ToggleGroupItem value="drawing" aria-label="Dibujo">
                      <Palette className="h-4 w-4 mr-2" />
                      Dibujo
                    </ToggleGroupItem>
                    <ToggleGroupItem value="code" aria-label="Código">
                      <Code className="h-4 w-4 mr-2" />
                      Código
                    </ToggleGroupItem>
                    <ToggleGroupItem value="voice" aria-label="Audio">
                      <Mic className="h-4 w-4 mr-2" />
                      Audio
                    </ToggleGroupItem>
                    <ToggleGroupItem value="image" aria-label="Imagen">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Imagen
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="note-title">Título *</Label>
                  <Input
                    id="note-title"
                    placeholder="Título de la nota"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="note-content">Contenido *</Label>
                  {renderNoteEditor(
                    formData.type,
                    formData.content,
                    (content) => setFormData({ ...formData, content })
                  )}
                </div>

                {/* Selector de tags */}
                {tags.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Tags (opcional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={formData.tagIds.includes(tag.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  tagIds: [...formData.tagIds, tag.id]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  tagIds: formData.tagIds.filter(id => id !== tag.id)
                                })
                              }
                            }}
                          />
                          <label
                            htmlFor={`tag-${tag.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-1"
                          >
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
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
                    "Guardar Nota"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog Editar Nota */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedNote && (
            <form onSubmit={handleEditNote}>
              <DialogHeader>
                <DialogTitle>Editar Nota</DialogTitle>
                <DialogDescription>
                  Modifica los detalles de tu nota
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Mostrar tipo pero no permitir cambio */}
                <div className="grid gap-2">
                  <Label>Tipo de nota</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-md">
                    {getNoteIcon(editFormData.type)}
                    {getNoteTypeLabel(editFormData.type)}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-note-title">Título *</Label>
                  <Input
                    id="edit-note-title"
                    placeholder="Título de la nota"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-note-content">Contenido *</Label>
                  {renderNoteEditor(
                    editFormData.type,
                    editFormData.content,
                    (content) => setEditFormData({ ...editFormData, content })
                  )}
                </div>

                {/* Selector de tags */}
                {tags.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Tags (opcional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-tag-${tag.id}`}
                            checked={editFormData.tagIds.includes(tag.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEditFormData({
                                  ...editFormData,
                                  tagIds: [...editFormData.tagIds, tag.id]
                                })
                              } else {
                                setEditFormData({
                                  ...editFormData,
                                  tagIds: editFormData.tagIds.filter(id => id !== tag.id)
                                })
                              }
                            }}
                          />
                          <label
                            htmlFor={`edit-tag-${tag.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-1"
                          >
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    "Actualizar Nota"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Búsqueda y Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notas por título..."
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
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTagFilter.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (selectedTagFilter.includes(tag.id)) {
                          setSelectedTagFilter(selectedTagFilter.filter(id => id !== tag.id))
                        } else {
                          setSelectedTagFilter([...selectedTagFilter, tag.id])
                        }
                      }}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </Badge>
                  ))}
                  {selectedTagFilter.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setSelectedTagFilter([])}
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {(searchQuery || selectedTagFilter.length > 0) && (
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredNotes.length} de {notes.length} notas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid de notas */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <Card 
                key={note.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleEditClick(note)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {getNoteIcon(note.type)}
                        <CardTitle className="line-clamp-1">{note.title}</CardTitle>
                      </div>
                      <CardDescription>
                        {new Date(note.updatedAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          handleEditClick(note)
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteNote(note.id)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    {renderNoteContent(note)}
                  </div>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary">
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery || selectedTagFilter.length > 0
                    ? "No se encontraron notas que coincidan con tu búsqueda"
                    : "No tienes notas aún. Crea tu primera nota haciendo clic en 'Nueva Nota'"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}