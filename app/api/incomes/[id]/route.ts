import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH - Actualizar ingreso
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { description, amount, date, isRecurring, frequency } = body;

    const income = await prisma.income.findUnique({
      where: { id },
    });

    if (!income) {
      return NextResponse.json(
        { error: "Ingreso no encontrado" },
        { status: 404 }
      );
    }

    if (income.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const updatedIncome = await prisma.income.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(frequency !== undefined && { frequency }),
      },
    });

    return NextResponse.json(updatedIncome);
  } catch (error) {
    console.error("Error al actualizar ingreso:", error);
    return NextResponse.json(
      { error: "Error al actualizar ingreso" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar ingreso
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const income = await prisma.income.findUnique({
      where: { id },
    });

    if (!income) {
      return NextResponse.json(
        { error: "Ingreso no encontrado" },
        { status: 404 }
      );
    }

    if (income.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await prisma.income.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar ingreso:", error);
    return NextResponse.json(
      { error: "Error al eliminar ingreso" },
      { status: 500 }
    );
  }
}
