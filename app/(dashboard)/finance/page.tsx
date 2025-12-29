"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, TrendingUp, TrendingDown, PiggyBank, FolderOpen, Target, CreditCard, Receipt } from "lucide-react"
import { CategoriesManager } from "@/components/finance/categories-manager"
import { IncomesManager } from "@/components/finance/incomes-manager"
import { ExpensesManager } from "@/components/finance/expenses-manager"
import { InvestmentsManager } from "@/components/finance/investments-manager"
import { BudgetsManager } from "@/components/finance/budgets-manager"
import { SavingsGoalsManager } from "@/components/finance/savings-goals-manager"
import { InstallmentPlansManager } from "@/components/finance/installment-plans-manager"

export default function FinancePage() {
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    totalInvestments: 0,
  })

  useEffect(() => {
    // Cargar estadísticas
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [incomes, expenses, investments] = await Promise.all([
        fetch("/api/incomes").then((res) => res.json()),
        fetch("/api/expenses").then((res) => res.json()),
        fetch("/api/investments").then((res) => res.json()),
      ])

      const totalIncome = incomes.reduce((sum: number, item: any) => sum + item.amount, 0)
      const totalExpenses = expenses.reduce((sum: number, item: any) => sum + item.amount, 0)
      const totalInvestments = investments.reduce((sum: number, item: any) => sum + item.amount, 0)
      const totalBalance = totalIncome - totalExpenses - totalInvestments

      setStats({
        totalBalance,
        totalIncome,
        totalExpenses,
        totalInvestments,
      })
    } catch (error) {
      console.error("Error al cargar estadísticas:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finanzas</h1>
        <p className="text-muted-foreground">
          Gestiona tus ingresos, gastos, inversiones y categorías
        </p>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              €{stats.totalBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresos - Gastos - Inversiones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              €{stats.totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total acumulado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              €{stats.totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total acumulado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inversiones</CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              €{stats.totalInvestments.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total invertido
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="categories">
            <FolderOpen className="h-4 w-4 mr-2" />
            Categorías
          </TabsTrigger>
          <TabsTrigger value="incomes">
            <TrendingUp className="h-4 w-4 mr-2" />
            Ingresos
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <TrendingDown className="h-4 w-4 mr-2" />
            Gastos
          </TabsTrigger>
          <TabsTrigger value="investments">
            <PiggyBank className="h-4 w-4 mr-2" />
            Inversiones
          </TabsTrigger>
          <TabsTrigger value="budgets">
            <CreditCard className="h-4 w-4 mr-2" />
            Presupuestos
          </TabsTrigger>
          <TabsTrigger value="savings">
            <Target className="h-4 w-4 mr-2" />
            Metas
          </TabsTrigger>
          <TabsTrigger value="installments">
            <Receipt className="h-4 w-4 mr-2" />
            Cuotas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <CategoriesManager />
        </TabsContent>

        <TabsContent value="incomes" className="space-y-4">
          <IncomesManager onUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <ExpensesManager onUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <InvestmentsManager onUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <BudgetsManager />
        </TabsContent>

        <TabsContent value="savings" className="space-y-4">
          <SavingsGoalsManager />
        </TabsContent>

        <TabsContent value="installments" className="space-y-4">
          <InstallmentPlansManager onUpdate={fetchStats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
