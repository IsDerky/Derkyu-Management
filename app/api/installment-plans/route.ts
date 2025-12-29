import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { addMonths } from "date-fns"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const plans = await prisma.installmentPlan.findMany({
      where: { userId: session.user.id },
      include: {
        category: true,
        payments: {
          orderBy: { paymentNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error("Error al obtener planes de cuotas:", error)
    return NextResponse.json(
      { error: "Error al obtener planes de cuotas" },
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
    const { description, totalAmount, numberOfPayments, dayOfMonth, firstPaymentDate, categoryId } = body

    if (!description || !totalAmount || !numberOfPayments || !dayOfMonth || !firstPaymentDate) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Calcular el monto de cada cuota
    const amountPerPayment = parseFloat(totalAmount) / parseInt(numberOfPayments)

    // Crear el plan de cuotas
    const plan = await prisma.installmentPlan.create({
      data: {
        description,
        totalAmount: parseFloat(totalAmount),
        numberOfPayments: parseInt(numberOfPayments),
        dayOfMonth: parseInt(dayOfMonth),
        firstPaymentDate: new Date(firstPaymentDate),
        categoryId: categoryId || null,
        userId: session.user.id,
        status: "active",
      },
    })

    // Crear los pagos individuales
    const payments = []
    for (let i = 0; i < parseInt(numberOfPayments); i++) {
      const dueDate = addMonths(new Date(firstPaymentDate), i)
      payments.push({
        installmentPlanId: plan.id,
        amount: amountPerPayment,
        dueDate,
        paymentNumber: i + 1,
        isPaid: false,
      })
    }

    await prisma.installmentPayment.createMany({
      data: payments,
    })

    // Obtener el plan completo con los pagos
    const completePlan = await prisma.installmentPlan.findUnique({
      where: { id: plan.id },
      include: {
        category: true,
        payments: {
          orderBy: { paymentNumber: "asc" },
        },
      },
    })

    return NextResponse.json(completePlan, { status: 201 })
  } catch (error) {
    console.error("Error al crear plan de cuotas:", error)
    return NextResponse.json(
      { error: "Error al crear plan de cuotas" },
      { status: 500 }
    )
  }
}
