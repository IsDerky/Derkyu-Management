"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Loader2, Calendar, CreditCard, CheckCircle2, Circle, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { format, isPast, isFuture } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"

interface InstallmentPayment {
  id: string
  amount: number
  dueDate: string
  paymentNumber: number
  isPaid: boolean
  paidDate?: string
  expenseId?: string
}

interface InstallmentPlan {
  id: string
  description: string
  totalAmount: number
  numberOfPayments: number
  dayOfMonth: number
  firstPaymentDate: string
  categoryId?: string
  category?: {
    id: string
    name: string
    color: string
    icon?: string
  }
  payments: InstallmentPayment[]
  status: string
}

interface Category {
  id: string
  name: string
  color: string
  icon?: string
}

export function InstallmentPlansManager({ onUpdate }: { onUpdate?: () => void }) {
  const [plans, setPlans] = useState<InstallmentPlan[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    totalAmount: "",
    numberOfPayments: "3",
    dayOfMonth: "1",
    firstPaymentDate: new Date().toISOString().split("T")[0],
    categoryId: "",
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPlans()
    fetchCategories()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/installment-plans")
      if (!response.ok) throw new Error("Error al cargar planes de cuotas")
      const data = await response.json()
      setPlans(data)
      onUpdate?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los planes de cuotas",
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
      const response = await fetch("/api/installment-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categoryId: formData.categoryId || null,
        }),
      })

      if (!response.ok) throw new Error("Error al crear plan de cuotas")

      toast({
        title: "Plan de cuotas creado",
        description: `El plan "${formData.description}" se creó correctamente`,
      })

      setDialogOpen(false)
      resetForm()
      fetchPlans()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el plan de cuotas",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      description: "",
      totalAmount: "",
      numberOfPayments: "3",
      dayOfMonth: "1",
      firstPaymentDate: new Date().toISOString().split("T")[0],
      categoryId: "",
    })
  }

  const handlePayInstallment = async (paymentId: string, planDescription: string, paymentNumber: number) => {
    if (!confirm(`¿Confirmar pago de la cuota ${paymentNumber}?`)) return

    try {
      const response = await fetch(`/api/installment-payments/${paymentId}/pay`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Error al procesar pago")

      const data = await response.json()

      toast({
        title: "Pago procesado",
        description: `La cuota ${paymentNumber} de "${planDescription}" fue pagada y se creó el gasto`,
      })

      fetchPlans()
      onUpdate?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar el pago",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string, description: string) => {
    if (!confirm(`¿Estás seguro de eliminar el plan "${description}"?`)) return

    try {
      const response = await fetch(`/api/installment-plans/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar plan")
      }

      toast({
        title: "Plan eliminado",
        description: `El plan "${description}" fue eliminado`,
      })

      fetchPlans()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el plan",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    resetForm()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Activo</Badge>
      case "completed":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Completado</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
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
          <h3 className="text-lg font-medium">Pagos en Cuotas</h3>
          <p className="text-sm text-muted-foreground">
            {plans.length} plan{plans.length !== 1 ? "es" : ""}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Plan de Cuotas</DialogTitle>
              <DialogDescription>
                Divide un gasto en varios pagos mensuales (estilo PayPal)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Gasto</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej: Compra televisión, Reparación coche..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Monto Total (€)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfPayments">Número de Cuotas</Label>
                <Select
                  value={formData.numberOfPayments}
                  onValueChange={(value) => setFormData({ ...formData, numberOfPayments: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 cuotas</SelectItem>
                    <SelectItem value="3">3 cuotas</SelectItem>
                    <SelectItem value="4">4 cuotas</SelectItem>
                    <SelectItem value="6">6 cuotas</SelectItem>
                    <SelectItem value="12">12 cuotas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">Día del Mes para Pago</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Cada cuota vencerá este día del mes
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstPaymentDate">Fecha del Primer Pago</Label>
                <Input
                  id="firstPaymentDate"
                  type="date"
                  value={formData.firstPaymentDate}
                  onChange={(e) => setFormData({ ...formData, firstPaymentDate: e.target.value })}
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
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">Resumen</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.totalAmount && formData.numberOfPayments ? (
                    <>
                      {formData.numberOfPayments} cuotas de €
                      {(parseFloat(formData.totalAmount) / parseInt(formData.numberOfPayments)).toFixed(2)}
                    </>
                  ) : (
                    "Completa los datos para ver el resumen"
                  )}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Plan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No hay planes de cuotas creados</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const paidCount = plan.payments.filter(p => p.isPaid).length
            const progress = (paidCount / plan.numberOfPayments) * 100

            return (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {plan.description}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {plan.category && `${plan.category.icon || ""} ${plan.category.name} • `}
                        €{plan.totalAmount.toFixed(2)} en {plan.numberOfPayments} cuotas
                      </CardDescription>
                    </div>
                    {getStatusBadge(plan.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{paidCount} de {plan.numberOfPayments} cuotas pagadas</span>
                      <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    {plan.payments.map((payment) => {
                      const dueDate = new Date(payment.dueDate)
                      const isOverdue = isPast(dueDate) && !payment.isPaid
                      const amountPerPayment = plan.totalAmount / plan.numberOfPayments

                      return (
                        <div
                          key={payment.id}
                          className={`flex items-center justify-between p-3 rounded-md border ${
                            payment.isPaid
                              ? "bg-green-500/5 border-green-500/20"
                              : isOverdue
                              ? "bg-red-500/5 border-red-500/20"
                              : "bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {payment.isPaid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : isOverdue ? (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                Cuota {payment.paymentNumber} de {plan.numberOfPayments}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {payment.isPaid
                                  ? `Pagado el ${format(new Date(payment.paidDate!), "d 'de' MMM, yyyy", { locale: es })}`
                                  : `Vence el ${format(dueDate, "d 'de' MMM, yyyy", { locale: es })}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">
                                €{amountPerPayment.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          {!payment.isPaid && (
                            <Button
                              size="sm"
                              variant={isOverdue ? "destructive" : "default"}
                              onClick={() => handlePayInstallment(payment.id, plan.description, payment.paymentNumber)}
                              className="ml-2"
                            >
                              Pagar
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {plan.status === "active" && paidCount === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(plan.id, plan.description)}
                      className="w-full"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
