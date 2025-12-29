"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Pencil, Loader2, Calendar, TrendingUp } from "lucide-react"
import { format, isWithinInterval } from "date-fns"
import { es } from "date-fns/locale"
import { DateRangeFilter, type DateRange } from "./date-range-filter"
import { SearchAndSort, type SortOption } from "./search-and-sort"
import { ViewToggle, type ViewMode } from "./view-toggle"

interface Investment {
  id: string
  description: string
  amount: number
  date: string
  type?: string
}

const INVESTMENT_TYPES = [
  { value: "stocks", label: "Acciones", icon: "📈" },
  { value: "crypto", label: "Criptomonedas", icon: "₿" },
  { value: "real_estate", label: "Bienes Raíces", icon: "🏠" },
  { value: "savings", label: "Ahorros", icon: "💰" },
  { value: "bonds", label: "Bonos", icon: "📄" },
  { value: "other", label: "Otro", icon: "💼" },
]

export function InvestmentsManager({ onUpdate }: { onUpdate?: () => void }) {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    type: "savings",
  })
  const [saving, setSaving] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("date-desc")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const { toast } = useToast()

  useEffect(() => {
    fetchInvestments()
  }, [])

  const fetchInvestments = async () => {
    try {
      const response = await fetch("/api/investments")
      if (!response.ok) throw new Error("Error al cargar inversiones")
      const data = await response.json()
      setInvestments(data)
      onUpdate?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las inversiones",
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
      const url = editingInvestment
        ? `/api/investments/${editingInvestment.id}`
        : "/api/investments"
      const method = editingInvestment ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Error al guardar inversión")

      toast({
        title: editingInvestment ? "Inversión actualizada" : "Inversión creada",
        description: `La inversión de €${formData.amount} se guardó correctamente`,
      })

      setDialogOpen(false)
      resetForm()
      fetchInvestments()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la inversión",
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
      type: "savings",
    })
    setEditingInvestment(null)
  }

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment)
    setFormData({
      description: investment.description,
      amount: investment.amount.toString(),
      date: new Date(investment.date).toISOString().split("T")[0],
      type: investment.type || "savings",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string, description: string) => {
    if (!confirm(`¿Estás seguro de eliminar la inversión "${description}"?`)) return

    try {
      const response = await fetch(`/api/investments/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar inversión")

      toast({
        title: "Inversión eliminada",
        description: `La inversión "${description}" fue eliminada`,
      })

      fetchInvestments()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la inversión",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    resetForm()
  }

  // Filtrar y ordenar inversiones
  const filteredAndSortedInvestments = useMemo(() => {
    let filtered = [...investments]

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter((investment) =>
        investment.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtrar por rango de fechas
    if (dateRange.from) {
      filtered = filtered.filter((investment) => {
        const investmentDate = new Date(investment.date)
        if (dateRange.to) {
          return isWithinInterval(investmentDate, { start: dateRange.from!, end: dateRange.to })
        }
        return investmentDate >= dateRange.from!
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
  }, [investments, searchQuery, dateRange, sortBy])

  const totalInvestments = filteredAndSortedInvestments.reduce((sum, inv) => sum + inv.amount, 0)

  const getInvestmentTypeInfo = (type?: string) => {
    return INVESTMENT_TYPES.find((t) => t.value === type) || INVESTMENT_TYPES[3]
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
          <h3 className="text-lg font-medium">Inversiones</h3>
          <p className="text-sm text-muted-foreground">
            Total: €{totalInvestments.toFixed(2)} • {filteredAndSortedInvestments.length} de {investments.length} registro{investments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Inversión
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingInvestment ? "Editar Inversión" : "Nueva Inversión"}
              </DialogTitle>
              <DialogDescription>
                {editingInvestment
                  ? "Modifica los datos de la inversión"
                  : "Registra una nueva inversión"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej: Bitcoin, Acciones Tesla, Fondo de inversión..."
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
                <Label htmlFor="type">Tipo de inversión</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          {type.label}
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
                  {editingInvestment ? "Actualizar" : "Crear"}
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

      {investments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No hay inversiones registradas</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar primera inversión
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {filteredAndSortedInvestments.map((investment) => {
            const typeInfo = getInvestmentTypeInfo(investment.type)
            return (
              <Card key={investment.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                      <span className="text-xl">{typeInfo.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{investment.description}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(investment.date), "d 'de' MMMM, yyyy", { locale: es })}
                        <span>•</span>
                        <TrendingUp className="h-3 w-3" />
                        {typeInfo.label}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-500">
                        €{investment.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(investment)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(investment.id, investment.description)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedInvestments.map((investment) => {
            const typeInfo = getInvestmentTypeInfo(investment.type)
            return (
              <Card key={investment.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
                      <span className="text-2xl">{typeInfo.icon}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(investment)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(investment.id, investment.description)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium line-clamp-2">{investment.description}</h4>
                    <p className="text-2xl font-bold text-blue-500">
                      €{investment.amount.toFixed(2)}
                    </p>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(investment.date), "d 'de' MMM, yyyy", { locale: es })}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {typeInfo.label}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
