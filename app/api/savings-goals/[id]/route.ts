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
    const { name, targetAmount, currentAmount, deadline, description } = body

    // Verificar que la meta pertenece al usuario
    const existing = await prisma.savingsGoal.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Meta de ahorro no encontrada" },
        { status: 404 }
      )
    }

    const savingsGoal = await prisma.savingsGoal.update({
      where: { id },
      data: {
        name,
        targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
        currentAmount: currentAmount !== undefined ? parseFloat(currentAmount) : undefined,
        deadline: deadline ? new Date(deadline) : null,
        description: description !== undefined ? description : undefined,
      },
    })

    return NextResponse.json(savingsGoal)
  } catch (error) {
    console.error("Error al actualizar meta de ahorro:", error)
    return NextResponse.json(
      { error: "Error al actualizar meta de ahorro" },
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

    // Verificar que la meta pertenece al usuario
    const existing = await prisma.savingsGoal.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Meta de ahorro no encontrada" },
        { status: 404 }
      )
    }

    await prisma.savingsGoal.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Meta de ahorro eliminada" })
  } catch (error) {
    console.error("Error al eliminar meta de ahorro:", error)
    return NextResponse.json(
      { error: "Error al eliminar meta de ahorro" },
      { status: 500 }
    )
  }
}
