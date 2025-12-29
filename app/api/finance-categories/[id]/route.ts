import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH - Actualizar categoría
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
    const { name, color, icon } = body;

    const category = await prisma.financeCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    if (category.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const updatedCategory = await prisma.financeCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(icon !== undefined && { icon }),
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    return NextResponse.json(
      { error: "Error al actualizar categoría" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar categoría
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

    const category = await prisma.financeCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    if (category.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await prisma.financeCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    return NextResponse.json(
      { error: "Error al eliminar categoría" },
      { status: 500 }
    );
  }
}
