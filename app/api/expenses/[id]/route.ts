import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH - Actualizar gasto
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
    const { description, amount, date, categoryId } = body;

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Gasto no encontrado" },
        { status: 404 }
      );
    }

    if (expense.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error("Error al actualizar gasto:", error);
    return NextResponse.json(
      { error: "Error al actualizar gasto" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar gasto
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

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Gasto no encontrado" },
        { status: 404 }
      );
    }

    if (expense.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar gasto:", error);
    return NextResponse.json(
      { error: "Error al eliminar gasto" },
      { status: 500 }
    );
  }
}
