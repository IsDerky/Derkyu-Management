import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const budgets = await prisma.budget.findMany({
      where: { userId: session.user.id },
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(budgets)
  } catch (error) {
    console.error("Error al obtener presupuestos:", error)
    return NextResponse.json(
      { error: "Error al obtener presupuestos" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, amount, period, startDate, endDate, categoryId } = body

    if (!name || !amount || !period || !startDate) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    const budget = await prisma.budget.create({
      data: {
        name,
        amount: parseFloat(amount),
        period,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        categoryId: categoryId || null,
        userId: session.user.id,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    console.error("Error al crear presupuesto:", error)
    return NextResponse.json(
      { error: "Error al crear presupuesto" },
      { status: 500 }
    )
  }
}
