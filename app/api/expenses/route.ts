import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - Obtener todos los gastos del usuario
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const expenses = await prisma.expense.findMany({
      where: { userId: session.user.id },
      include: {
        category: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error al obtener gastos:", error);
    return NextResponse.json(
      { error: "Error al obtener gastos" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo gasto
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { description, amount, date, categoryId } = body;

    if (!description || !amount || !date) {
      return NextResponse.json(
        { error: "Descripción, monto y fecha son requeridos" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        categoryId,
        userId: session.user.id,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error al crear gasto:", error);
    return NextResponse.json(
      { error: "Error al crear gasto" },
      { status: 500 }
    );
  }
}
