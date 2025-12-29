import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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

    // Verificar que el plan pertenece al usuario
    const existing = await prisma.installmentPlan.findUnique({
      where: { id },
      include: { payments: true },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Plan de cuotas no encontrado" },
        { status: 404 }
      )
    }

    // No permitir eliminar si ya hay pagos realizados
    const hasPaidPayments = existing.payments.some(p => p.isPaid)
    if (hasPaidPayments) {
      return NextResponse.json(
        { error: "No se puede eliminar un plan con pagos ya realizados" },
        { status: 400 }
      )
    }

    // Eliminar el plan (las cuotas se eliminan en cascada)
    await prisma.installmentPlan.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Plan de cuotas eliminado" })
  } catch (error) {
    console.error("Error al eliminar plan de cuotas:", error)
    return NextResponse.json(
      { error: "Error al eliminar plan de cuotas" },
      { status: 500 }
    )
  }
}

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
    const { status } = body

    // Verificar que el plan pertenece al usuario
    const existing = await prisma.installmentPlan.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Plan de cuotas no encontrado" },
        { status: 404 }
      )
    }

    const plan = await prisma.installmentPlan.update({
      where: { id },
      data: {
        status: status || existing.status,
      },
      include: {
        category: true,
        payments: {
          orderBy: { paymentNumber: "asc" },
        },
      },
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error("Error al actualizar plan de cuotas:", error)
    return NextResponse.json(
      { error: "Error al actualizar plan de cuotas" },
      { status: 500 }
    )
  }
}
