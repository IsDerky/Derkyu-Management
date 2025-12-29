"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Pencil, Loader2, Target, Calendar, TrendingUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"

interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  description?: string
}

export function SavingsGoalsManager() {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
    description: "",
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSavingsGoals()
  }, [])

  const fetchSavingsGoals = async () => {
    try {
      const response = await fetch("/api/savings-goals")
      if (!response.ok) throw new Error("Error al cargar metas de ahorro")
      const data = await response.json()
      setSavingsGoals(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las metas de ahorro",
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
      const url = editingGoal
        ? `/api/savings-goals/${editingGoal.id}`
        : "/api/savings-goals"
      const method = editingGoal ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          deadline: formData.deadline || null,
          description: formData.description || null,
        }),
      })

      if (!response.ok) throw new Error("Error al guardar meta de ahorro")

      toast({
        title: editingGoal ? "Meta actualizada" : "Meta creada",
        description: `La meta "${formData.name}" se guardó correctamente`,
      })

      setDialogOpen(false)
      resetForm()
      fetchSavingsGoals()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la meta de ahorro",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      targetAmount: "",
      currentAmount: "",
      deadline: "",
      description: "",
    })
    setEditingGoal(null)
  }

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal)
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split("T")[0] : "",
      description: goal.description || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la meta "${name}"?`)) return

    try {
      const response = await fetch(`/api/savings-goals/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar meta")

      toast({
        title: "Meta eliminada",
        description: `La meta "${name}" fue eliminada`,
      })

      fetchSavingsGoals()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la meta",
        variant: "destructive",
      })
    }
  }

  const handleAddAmount = async (goal: SavingsGoal) => {
    const amountStr = prompt("¿Cuánto deseas agregar a esta meta?")
    if (!amountStr) return

    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser un número positivo",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/savings-goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentAmount: goal.currentAmount + amount,
        }),
      })

      if (!response.ok) throw new Error("Error al actualizar meta")

      toast({
        title: "Monto agregado",
        description: `Se agregaron €${amount.toFixed(2)} a "${goal.name}"`,
      })

      fetchSavingsGoals()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la meta",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    resetForm()
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
          <h3 className="text-lg font-medium">Metas de Ahorro</h3>
          <p className="text-sm text-muted-foreground">
            {savingsGoals.length} meta{savingsGoals.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? "Editar Meta" : "Nueva Meta de Ahorro"}
              </DialogTitle>
              <DialogDescription>
                {editingGoal
                  ? "Modifica los datos de la meta"
                  : "Crea una meta para alcanzar tus objetivos"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Vacaciones, Auto nuevo, Fondo de emergencia..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Meta (€)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentAmount">Cantidad Actual (€)</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Fecha Objetivo (opcional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe tu meta..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingGoal ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {savingsGoals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No hay metas de ahorro creadas</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {savingsGoals.map((goal) => {
            const percentage = (goal.currentAmount / goal.targetAmount) * 100
            const remaining = goal.targetAmount - goal.currentAmount
            const isCompleted = goal.currentAmount >= goal.targetAmount
            const daysRemaining = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null

            return (
              <Card key={goal.id} className={isCompleted ? "border-green-500" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        {goal.name}
                      </CardTitle>
                      {goal.deadline && (
                        <CardDescription className="text-xs flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(goal.deadline), "d 'de' MMMM, yyyy", { locale: es })}
                          {daysRemaining !== null && daysRemaining >= 0 && (
                            <span className="ml-1">
                              ({daysRemaining} día{daysRemaining !== 1 ? "s" : ""} restante{daysRemaining !== 1 ? "s" : ""})
                            </span>
                          )}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {goal.description && (
                    <p className="text-xs text-muted-foreground">{goal.description}</p>
                  )}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className={isCompleted ? "text-green-500 font-medium" : ""}>
                        €{goal.currentAmount.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">
                        de €{goal.targetAmount.toFixed(2)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className={`h-2 ${isCompleted ? "[&>div]:bg-green-500" : ""}`}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {percentage.toFixed(0)}% alcanzado
                    </p>
                  </div>
                  {!isCompleted && (
                    <p className="text-xs text-muted-foreground">
                      Faltan €{remaining.toFixed(2)} para alcanzar la meta
                    </p>
                  )}
                  {isCompleted && (
                    <p className="text-xs text-green-500 font-medium">
                      ¡Meta alcanzada! 🎉
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAddAmount(goal)}
                      className="flex-1"
                      disabled={isCompleted}
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Agregar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(goal)}
                      className="flex-1"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(goal.id, goal.name)}
                    >
                      <Trash2 className="h-3 w-3" />
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
