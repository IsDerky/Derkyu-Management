import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - Obtener todos los ingresos del usuario
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const incomes = await prisma.income.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(incomes);
  } catch (error) {
    console.error("Error al obtener ingresos:", error);
    return NextResponse.json(
      { error: "Error al obtener ingresos" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo ingreso
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { description, amount, date, isRecurring, frequency } = body;

    if (!description || !amount || !date) {
      return NextResponse.json(
        { error: "Descripción, monto y fecha son requeridos" },
        { status: 400 }
      );
    }

    const income = await prisma.income.create({
      data: {
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        isRecurring: isRecurring || false,
        frequency,
        userId: session.user.id,
      },
    });

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error("Error al crear ingreso:", error);
    return NextResponse.json(
      { error: "Error al crear ingreso" },
      { status: 500 }
    );
  }
}
