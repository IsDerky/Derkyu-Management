import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH - Actualizar inversión
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
    const { description, amount, date, type } = body;

    const investment = await prisma.investment.findUnique({
      where: { id },
    });

    if (!investment) {
      return NextResponse.json(
        { error: "Inversión no encontrada" },
        { status: 404 }
      );
    }

    if (investment.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const updatedInvestment = await prisma.investment.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(type !== undefined && { type }),
      },
    });

    return NextResponse.json(updatedInvestment);
  } catch (error) {
    console.error("Error al actualizar inversión:", error);
    return NextResponse.json(
      { error: "Error al actualizar inversión" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar inversión
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

    const investment = await prisma.investment.findUnique({
      where: { id },
    });

    if (!investment) {
      return NextResponse.json(
        { error: "Inversión no encontrada" },
        { status: 404 }
      );
    }

    if (investment.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await prisma.investment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar inversión:", error);
    return NextResponse.json(
      { error: "Error al eliminar inversión" },
      { status: 500 }
    );
  }
}
