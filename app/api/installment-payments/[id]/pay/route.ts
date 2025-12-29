import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = params

    // Obtener el pago con su plan
    const payment = await prisma.installmentPayment.findUnique({
      where: { id },
      include: {
        installmentPlan: true,
      },
    })

    if (!payment || payment.installmentPlan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      )
    }

    if (payment.isPaid) {
      return NextResponse.json(
        { error: "Este pago ya fue realizado" },
        { status: 400 }
      )
    }

    // Crear el gasto
    const expense = await prisma.expense.create({
      data: {
        description: `${payment.installmentPlan.description} (Cuota ${payment.paymentNumber}/${payment.installmentPlan.numberOfPayments})`,
        amount: payment.amount,
        date: new Date(),
        categoryId: payment.installmentPlan.categoryId,
        userId: session.user.id,
      },
    })

    // Marcar el pago como realizado
    const updatedPayment = await prisma.installmentPayment.update({
      where: { id },
      data: {
        isPaid: true,
        paidDate: new Date(),
        expenseId: expense.id,
      },
    })

    // Verificar si todos los pagos están completos
    const allPayments = await prisma.installmentPayment.findMany({
      where: { installmentPlanId: payment.installmentPlanId },
    })

    const allPaid = allPayments.every(p => p.isPaid)

    if (allPaid) {
      // Marcar el plan como completado
      await prisma.installmentPlan.update({
        where: { id: payment.installmentPlanId },
        data: { status: "completed" },
      })
    }

    return NextResponse.json({ payment: updatedPayment, expense })
  } catch (error) {
    console.error("Error al procesar pago:", error)
    return NextResponse.json(
      { error: "Error al procesar pago" },
      { status: 500 }
    )
  }
}
