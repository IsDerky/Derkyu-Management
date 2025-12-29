"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Wallet } from "lucide-react"

export default function SettingsPage() {
  const [financeEnabled, setFinanceEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Cargar configuración al montar el componente
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      if (!response.ok) throw new Error("Error al cargar configuración")

      const data = await response.json()
      setFinanceEnabled(data.financeEnabled)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFinance = async () => {
    setSaving(true)
    const newValue = !financeEnabled

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ financeEnabled: newValue }),
      })

      if (!response.ok) throw new Error("Error al actualizar configuración")

      setFinanceEnabled(newValue)
      toast({
        title: "Configuración actualizada",
        description: `Módulo de finanzas ${newValue ? "habilitado" : "deshabilitado"}`,
      })

      // Recargar la página para actualizar el sidebar
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Personaliza tu experiencia en Derkyu Management
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Módulos</CardTitle>
          <CardDescription>
            Habilita o deshabilita módulos según tus necesidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
                <Wallet className="h-6 w-6 text-green-500" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="finance-module" className="text-base font-medium">
                  Módulo de Finanzas
                </Label>
                <p className="text-sm text-muted-foreground">
                  Gestiona tus ingresos, gastos y presupuestos
                </p>
              </div>
            </div>
            <Button
              id="finance-module"
              variant={financeEnabled ? "outline" : "default"}
              onClick={handleToggleFinance}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {financeEnabled ? "Deshabilitar" : "Habilitar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
