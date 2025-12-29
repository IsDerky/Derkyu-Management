"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Pencil, Loader2, TrendingDown, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { format, isWithinInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from "date-fns"
import { es } from "date-fns/locale"

interface Budget {
  id: string
  name: string
  amount: number
  period: string
  startDate: string
  endDate?: string
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

interface Expense {
  id: string
  amount: number
  date: string
  categoryId?: string
}

export function BudgetsManager() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    period: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    categoryId: "",
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchBudgets()
    fetchCategories()
    fetchExpenses()
  }, [])

  const fetchBudgets = async () => {
    try {
      const response = await fetch("/api/budgets")
      if (!response.ok) throw new Error("Error al cargar presupuestos")
      const data = await response.json()
      setBudgets(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los presupuestos",
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

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/expenses")
      if (!response.ok) throw new Error("Error al cargar gastos")
      const data = await response.json()
      setExpenses(data)
    } catch (error) {
      console.error("Error al cargar gastos:", error)
    }
  }

  const calculateSpent = (budget: Budget): number => {
    const now = new Date()
    let periodStart: Date
    let periodEnd: Date

    // Calcular el rango de fechas según el período
    switch (budget.period) {
      case "weekly":
        periodStart = startOfWeek(now, { weekStartsOn: 1 })
        periodEnd = endOfWeek(now, { weekStartsOn: 1 })
        break
      case "monthly":
        periodStart = startOfMonth(now)
        periodEnd = endOfMonth(now)
        break
      case "yearly":
        periodStart = startOfYear(now)
        periodEnd = endOfYear(now)
        break
      case "custom":
        periodStart = new Date(budget.startDate)
        periodEnd = budget.endDate ? new Date(budget.endDate) : now
        break
      default:
        periodStart = startOfMonth(now)
        periodEnd = endOfMonth(now)
    }

    // Filtrar gastos en el período y categoría
    const filtered = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      const inPeriod = isWithinInterval(expenseDate, { start: periodStart, end: periodEnd })
      const inCategory = budget.categoryId ? expense.categoryId === budget.categoryId : true
      return inPeriod && inCategory
    })

    return filtered.reduce((sum, expense) => sum + expense.amount, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingBudget
        ? `/api/budgets/${editingBudget.id}`
        : "/api/budgets"
      const method = editingBudget ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categoryId: formData.categoryId || null,
          endDate: formData.endDate || null,
        }),
      })

      if (!response.ok) throw new Error("Error al guardar presupuesto")

      toast({
        title: editingBudget ? "Presupuesto actualizado" : "Presupuesto creado",
        description: `El presupuesto "${formData.name}" se guardó correctamente`,
      })

      setDialogOpen(false)
      resetForm()
      fetchBudgets()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el presupuesto",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      period: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      categoryId: "",
    })
    setEditingBudget(null)
  }

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setFormData({
      name: budget.name,
      amount: budget.amount.toString(),
      period: budget.period,
      startDate: new Date(budget.startDate).toISOString().split("T")[0],
      endDate: budget.endDate ? new Date(budget.endDate).toISOString().split("T")[0] : "",
      categoryId: budget.categoryId || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el presupuesto "${name}"?`)) return

    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar presupuesto")

      toast({
        title: "Presupuesto eliminado",
        description: `El presupuesto "${name}" fue eliminado`,
      })

      fetchBudgets()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el presupuesto",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    resetForm()
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "weekly": return "Semanal"
      case "monthly": return "Mensual"
      case "yearly": return "Anual"
      case "custom": return "Personalizado"
      default: return period
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
          <h3 className="text-lg font-medium">Presupuestos</h3>
          <p className="text-sm text-muted-foreground">
            {budgets.length} presupuesto{budgets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBudget ? "Editar Presupuesto" : "Nuevo Presupuesto"}
              </DialogTitle>
              <DialogDescription>
                {editingBudget
                  ? "Modifica los datos del presupuesto"
                  : "Crea un presupuesto para controlar tus gastos"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Gastos del hogar, Entretenimiento..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monto Límite</Label>
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
                <Label htmlFor="period">Período</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value) => setFormData({ ...formData, period: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.period === "custom" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha de Inicio</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha de Fin</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="category">Categoría (opcional)</Label>
                <Select
                  value={formData.categoryId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todas las categorías</SelectItem>
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
                  {editingBudget ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No hay presupuestos creados</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer presupuesto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((budget) => {
            const spent = calculateSpent(budget)
            const percentage = (spent / budget.amount) * 100
            const isOverBudget = spent > budget.amount
            const isNearLimit = percentage >= 80 && !isOverBudget

            return (
              <Card key={budget.id} className={isOverBudget ? "border-red-500" : isNearLimit ? "border-yellow-500" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {budget.name}
                        {isOverBudget && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </CardTitle>
                      <CardDescription className="text-xs flex items-center gap-1 mt-1">
                        <TrendingDown className="h-3 w-3" />
                        {getPeriodLabel(budget.period)}
                        {budget.category && ` • ${budget.category.icon || ""} ${budget.category.name}`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className={isOverBudget ? "text-red-500 font-medium" : ""}>
                        €{spent.toFixed(2)} gastado
                      </span>
                      <span className="text-muted-foreground">
                        de €{budget.amount.toFixed(2)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className={`h-2 ${isOverBudget ? "[&>div]:bg-red-500" : isNearLimit ? "[&>div]:bg-yellow-500" : ""}`}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {percentage.toFixed(0)}% utilizado
                    </p>
                  </div>
                  {isOverBudget && (
                    <p className="text-xs text-red-500">
                      Superado por €{(spent - budget.amount).toFixed(2)}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(budget)}
                      className="flex-1"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(budget.id, budget.name)}
                      className="flex-1"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar
                    </Button>
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
