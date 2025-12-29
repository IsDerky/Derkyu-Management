import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - Obtener todas las inversiones del usuario
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const investments = await prisma.investment.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(investments);
  } catch (error) {
    console.error("Error al obtener inversiones:", error);
    return NextResponse.json(
      { error: "Error al obtener inversiones" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva inversión
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { description, amount, date, type } = body;

    if (!description || !amount || !date) {
      return NextResponse.json(
        { error: "Descripción, monto y fecha son requeridos" },
        { status: 400 }
      );
    }

    const investment = await prisma.investment.create({
      data: {
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        type,
        userId: session.user.id,
      },
    });

    return NextResponse.json(investment, { status: 201 });
  } catch (error) {
    console.error("Error al crear inversión:", error);
    return NextResponse.json(
      { error: "Error al crear inversión" },
      { status: 500 }
    );
  }
}
