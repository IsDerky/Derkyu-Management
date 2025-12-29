import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const savingsGoals = await prisma.savingsGoal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(savingsGoals)
  } catch (error) {
    console.error("Error al obtener metas de ahorro:", error)
    return NextResponse.json(
      { error: "Error al obtener metas de ahorro" },
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
    const { name, targetAmount, currentAmount, deadline, description } = body

    if (!name || !targetAmount) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    const savingsGoal = await prisma.savingsGoal.create({
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        deadline: deadline ? new Date(deadline) : null,
        description: description || null,
        userId: session.user.id,
      },
    })

    return NextResponse.json(savingsGoal, { status: 201 })
  } catch (error) {
    console.error("Error al crear meta de ahorro:", error)
    return NextResponse.json(
      { error: "Error al crear meta de ahorro" },
      { status: 500 }
    )
  }
}
