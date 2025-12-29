import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, amount, period, startDate, endDate, categoryId } = body

    // Verificar que el presupuesto pertenece al usuario
    const existing = await prisma.budget.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      )
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: {
        name,
        amount: amount ? parseFloat(amount) : undefined,
        period,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        categoryId: categoryId === "" ? null : categoryId,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(budget)
  } catch (error) {
    console.error("Error al actualizar presupuesto:", error)
    return NextResponse.json(
      { error: "Error al actualizar presupuesto" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = params

    // Verificar que el presupuesto pertenece al usuario
    const existing = await prisma.budget.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      )
    }

    await prisma.budget.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Presupuesto eliminado" })
  } catch (error) {
    console.error("Error al eliminar presupuesto:", error)
    return NextResponse.json(
      { error: "Error al eliminar presupuesto" },
      { status: 500 }
    )
  }
}
