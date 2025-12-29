"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Pencil, Loader2, Calendar, DollarSign, Tag } from "lucide-react"
import { format, isWithinInterval } from "date-fns"
import { es } from "date-fns/locale"
import { DateRangeFilter, type DateRange } from "./date-range-filter"
import { SearchAndSort, type SortOption } from "./search-and-sort"
import { ViewToggle, type ViewMode } from "./view-toggle"

interface Expense {
  id: string
  description: string
  amount: number
  date: string
  categoryId?: string
  category?: {
    id: string
    name: string
    color: string
    icon?: string
  }
}

interface Category {
  id: string
  name: string
  color: string
  icon?: string
}

export function ExpensesManager({ onUpdate }: { onUpdate?: () => void }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
  })
  const [saving, setSaving] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("date-desc")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const { toast } = useToast()

  useEffect(() => {
    fetchExpenses()
    fetchCategories()
  }, [])

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/expenses")
      if (!response.ok) throw new Error("Error al cargar gastos")
      const data = await response.json()
      setExpenses(data)
      onUpdate?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los gastos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/finance-categories")
      if (!response.ok) throw new Error("Error al cargar categorías")
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error("Error al cargar categorías:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingExpense
        ? `/api/expenses/${editingExpense.id}`
        : "/api/expenses"
      const method = editingExpense ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categoryId: formData.categoryId || null,
        }),
      })

      if (!response.ok) throw new Error("Error al guardar gasto")

      toast({
        title: editingExpense ? "Gasto actualizado" : "Gasto creado",
        description: `El gasto de €${formData.amount} se guardó correctamente`,
      })

      setDialogOpen(false)
      resetForm()
      fetchExpenses()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el gasto",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      categoryId: "",
    })
    setEditingExpense(null)
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      date: new Date(expense.date).toISOString().split("T")[0],
      categoryId: expense.categoryId || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string, description: string) => {
    if (!confirm(`¿Estás seguro de eliminar el gasto "${description}"?`)) return

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar gasto")

      toast({
        title: "Gasto eliminado",
        description: `El gasto "${description}" fue eliminado`,
      })

      fetchExpenses()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el gasto",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    resetForm()
  }

  // Filtrar y ordenar gastos
  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = [...expenses]

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter((expense) =>
        expense.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtrar por rango de fechas
    if (dateRange.from) {
      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date)
        if (dateRange.to) {
          return isWithinInterval(expenseDate, { start: dateRange.from!, end: dateRange.to })
        }
        return expenseDate >= dateRange.from!
      })
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "amount-desc":
          return b.amount - a.amount
        case "amount-asc":
          return a.amount - b.amount
        case "description-asc":
          return a.description.localeCompare(b.description)
        default:
          return 0
      }
    })

    return filtered
  }, [expenses, searchQuery, dateRange, sortBy])

  const totalExpenses = filteredAndSortedExpenses.reduce((sum, expense) => sum + expense.amount, 0)

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
          <h3 className="text-lg font-medium">Gastos</h3>
          <p className="text-sm text-muted-foreground">
            Total: €{totalExpenses.toFixed(2)} • {filteredAndSortedExpenses.length} de {expenses.length} registro{expenses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? "Editar Gasto" : "Nuevo Gasto"}
              </DialogTitle>
              <DialogDescription>
                {editingExpense
                  ? "Modifica los datos del gasto"
                  : "Registra un nuevo gasto"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej: Supermercado, Gasolina, Restaurante..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría (opcional)</Label>
                <Select
                  value={formData.categoryId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          {category.icon && <span>{category.icon}</span>}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingExpense ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros y búsqueda */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2 justify-between">
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
          />
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </div>
        <SearchAndSort
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          sortValue={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No hay gastos registrados</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar primer gasto
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {filteredAndSortedExpenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-lg"
                    style={{
                      backgroundColor: expense.category?.color
                        ? `${expense.category.color}15`
                        : "#ef444415",
                    }}
                  >
                    {expense.category?.icon ? (
                      <span className="text-xl">{expense.category.icon}</span>
                    ) : (
                      <DollarSign
                        className="h-5 w-5"
                        style={{ color: expense.category?.color || "#ef4444" }}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(expense.date), "d 'de' MMMM, yyyy", { locale: es })}
                      {expense.category && (
                        <>
                          <span>•</span>
                          <Tag className="h-3 w-3" />
                          {expense.category.name}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-500">
                      -€{expense.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(expense)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(expense.id, expense.description)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedExpenses.map((expense) => (
            <Card key={expense.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-lg"
                    style={{
                      backgroundColor: expense.category?.color
                        ? `${expense.category.color}15`
                        : "#ef444415",
                    }}
                  >
                    {expense.category?.icon ? (
                      <span className="text-2xl">{expense.category.icon}</span>
                    ) : (
                      <DollarSign
                        className="h-6 w-6"
                        style={{ color: expense.category?.color || "#ef4444" }}
                      />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(expense)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(expense.id, expense.description)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium line-clamp-2">{expense.description}</h4>
                  <p className="text-2xl font-bold text-red-500">
                    -€{expense.amount.toFixed(2)}
                  </p>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(expense.date), "d 'de' MMM, yyyy", { locale: es })}
                    </div>
                    {expense.category && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {expense.category.name}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
