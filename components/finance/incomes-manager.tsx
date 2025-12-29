"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Pencil, Loader2, Calendar, DollarSign, RefreshCw } from "lucide-react"
import { format, isWithinInterval } from "date-fns"
import { es } from "date-fns/locale"
import { DateRangeFilter, type DateRange } from "./date-range-filter"
import { SearchAndSort, type SortOption } from "./search-and-sort"
import { ViewToggle, type ViewMode } from "./view-toggle"

interface Income {
  id: string
  description: string
  amount: number
  date: string
  isRecurring: boolean
  frequency?: string
}

export function IncomesManager({ onUpdate }: { onUpdate?: () => void }) {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    isRecurring: false,
    frequency: "monthly",
  })
  const [saving, setSaving] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("date-desc")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const { toast } = useToast()

  useEffect(() => {
    fetchIncomes()
  }, [])

  const fetchIncomes = async () => {
    try {
      const response = await fetch("/api/incomes")
      if (!response.ok) throw new Error("Error al cargar ingresos")
      const data = await response.json()
      setIncomes(data)
      onUpdate?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los ingresos",
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
      const url = editingIncome
        ? `/api/incomes/${editingIncome.id}`
        : "/api/incomes"
      const method = editingIncome ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Error al guardar ingreso")

      toast({
        title: editingIncome ? "Ingreso actualizado" : "Ingreso creado",
        description: `El ingreso de €${formData.amount} se guardó correctamente`,
      })

      setDialogOpen(false)
      resetForm()
      fetchIncomes()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el ingreso",
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
      isRecurring: false,
      frequency: "monthly",
    })
    setEditingIncome(null)
  }

  const handleEdit = (income: Income) => {
    setEditingIncome(income)
    setFormData({
      description: income.description,
      amount: income.amount.toString(),
      date: new Date(income.date).toISOString().split("T")[0],
      isRecurring: income.isRecurring,
      frequency: income.frequency || "monthly",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string, description: string) => {
    if (!confirm(`¿Estás seguro de eliminar el ingreso "${description}"?`)) return

    try {
      const response = await fetch(`/api/incomes/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar ingreso")

      toast({
        title: "Ingreso eliminado",
        description: `El ingreso "${description}" fue eliminado`,
      })

      fetchIncomes()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el ingreso",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    resetForm()
  }

  // Filtrar y ordenar ingresos
  const filteredAndSortedIncomes = useMemo(() => {
    let filtered = [...incomes]

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter((income) =>
        income.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtrar por rango de fechas
    if (dateRange.from) {
      filtered = filtered.filter((income) => {
        const incomeDate = new Date(income.date)
        if (dateRange.to) {
          return isWithinInterval(incomeDate, { start: dateRange.from!, end: dateRange.to })
        }
        return incomeDate >= dateRange.from!
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
  }, [incomes, searchQuery, dateRange, sortBy])

  const totalIncomes = filteredAndSortedIncomes.reduce((sum, income) => sum + income.amount, 0)

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
          <h3 className="text-lg font-medium">Ingresos</h3>
          <p className="text-sm text-muted-foreground">
            Total: €{totalIncomes.toFixed(2)} • {filteredAndSortedIncomes.length} de {incomes.length} registro{incomes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ingreso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingIncome ? "Editar Ingreso" : "Nuevo Ingreso"}
              </DialogTitle>
              <DialogDescription>
                {editingIncome
                  ? "Modifica los datos del ingreso"
                  : "Registra un nuevo ingreso"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej: Salario, Freelance, Venta..."
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRecurring: checked as boolean })
                  }
                />
                <Label htmlFor="isRecurring" className="cursor-pointer">
                  Ingreso recurrente
                </Label>
              </div>
              {formData.isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frecuencia</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quincenal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingIncome ? "Actualizar" : "Crear"}
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

      {incomes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No hay ingresos registrados</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar primer ingreso
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {filteredAndSortedIncomes.map((income) => (
            <Card key={income.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{income.description}</p>
                      {income.isRecurring && (
                        <RefreshCw className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(income.date), "d 'de' MMMM, yyyy", { locale: es })}
                      {income.isRecurring && (
                        <span className="ml-1">
                          • {income.frequency === "weekly" ? "Semanal" :
                             income.frequency === "biweekly" ? "Quincenal" :
                             income.frequency === "monthly" ? "Mensual" : "Anual"}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-500">
                      +€{income.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(income)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(income.id, income.description)}
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
          {filteredAndSortedIncomes.map((income) => (
            <Card key={income.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(income)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(income.id, income.description)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium line-clamp-2">{income.description}</h4>
                    {income.isRecurring && (
                      <RefreshCw className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-2xl font-bold text-green-500">
                    +€{income.amount.toFixed(2)}
                  </p>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(income.date), "d 'de' MMM, yyyy", { locale: es })}
                    </div>
                    {income.isRecurring && (
                      <div className="flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        {income.frequency === "weekly" ? "Semanal" :
                         income.frequency === "biweekly" ? "Quincenal" :
                         income.frequency === "monthly" ? "Mensual" : "Anual"}
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
