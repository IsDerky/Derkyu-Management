import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - Obtener todas las categorías del usuario
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const categories = await prisma.financeCategory.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva categoría
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, color, icon } = body;

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    const category = await prisma.financeCategory.create({
      data: {
        name,
        color: color || "#3b82f6",
        icon,
        userId: session.user.id,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error al crear categoría:", error);
    return NextResponse.json(
      { error: "Error al crear categoría" },
      { status: 500 }
    );
  }
}
