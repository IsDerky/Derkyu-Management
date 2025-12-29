"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Pencil, Loader2, Calendar, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Category {
  id: string
  name: string
  color: string
  icon?: string
  _count?: {
    expenses: number
  }
}

interface Expense {
  id: string
  description: string
  amount: number
  date: string
  categoryId?: string
}

const COLORS = [
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#22c55e" },
  { name: "Rojo", value: "#ef4444" },
  { name: "Amarillo", value: "#eab308" },
  { name: "Morado", value: "#a855f7" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Naranja", value: "#f97316" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Gris", value: "#6b7280" },
]

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6",
    icon: "",
  })
  const [saving, setSaving] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categoryExpenses, setCategoryExpenses] = useState<Expense[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/finance-categories")
      if (!response.ok) throw new Error("Error al cargar categorías")
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingCategory
        ? `/api/finance-categories/${editingCategory.id}`
        : "/api/finance-categories"
      const method = editingCategory ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Error al guardar categoría")

      toast({
        title: editingCategory ? "Categoría actualizada" : "Categoría creada",
        description: `La categoría "${formData.name}" se guardó correctamente`,
      })

      setDialogOpen(false)
      setFormData({ name: "", color: "#3b82f6", icon: "" })
      setEditingCategory(null)
      fetchCategories()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la categoría",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) return

    try {
      const response = await fetch(`/api/finance-categories/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar categoría")

      toast({
        title: "Categoría eliminada",
        description: `La categoría "${name}" fue eliminada`,
      })

      fetchCategories()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingCategory(null)
    setFormData({ name: "", color: "#3b82f6", icon: "" })
  }

  const handleViewExpenses = async (category: Category) => {
    setSelectedCategory(category)
    setSheetOpen(true)
    setLoadingExpenses(true)

    try {
      const response = await fetch(`/api/expenses`)
      if (!response.ok) throw new Error("Error al cargar gastos")

      const allExpenses: Expense[] = await response.json()
      const filtered = allExpenses.filter(exp => exp.categoryId === category.id)
      setCategoryExpenses(filtered)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los gastos",
        variant: "destructive",
      })
    } finally {
      setLoadingExpenses(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Categorías de Gastos</h3>
          <p className="text-sm text-muted-foreground">
            {categories.length} categoría{categories.length !== 1 ? "s" : ""} creada{categories.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Modifica los datos de la categoría"
                  : "Crea una nueva categoría para organizar tus gastos"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Comida, Transporte, Ocio..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Emoji (opcional)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Ej: 🍔, 🚗, 🎮..."
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-5 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`h-10 rounded-md border-2 transition-all ${
                        formData.color === color.value
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCategory ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No hay categorías creadas</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera categoría
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {category.icon && <span className="text-2xl">{category.icon}</span>}
                    <div>
                      <CardTitle className="text-base">{category.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {category._count?.expenses || 0} gasto{category._count?.expenses !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                  </div>
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewExpenses(category)}
                  className="flex-1"
                  disabled={!category._count?.expenses}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(category)}
                  className="flex-1"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(category.id, category.name)}
                  className="flex-1"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Eliminar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sheet para ver gastos de la categoría */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedCategory?.icon && <span className="text-2xl">{selectedCategory.icon}</span>}
              Gastos en {selectedCategory?.name}
            </SheetTitle>
            <SheetDescription>
              {categoryExpenses.length} gasto{categoryExpenses.length !== 1 ? "s" : ""} • Total: €
              {categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {loadingExpenses ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : categoryExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-muted-foreground">
                  No hay gastos en esta categoría
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {categoryExpenses.map((expense) => (
                  <Card key={expense.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(expense.date), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-500">
                          -€{expense.amount.toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
