import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - Obtener configuración del usuario
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Buscar o crear configuración
    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Si no existe, crear con valores por defecto
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          financeEnabled: false,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar configuración del usuario
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { financeEnabled } = body;

    // Buscar o crear configuración
    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      // Crear nueva configuración
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          financeEnabled: financeEnabled ?? false,
        },
      });
    } else {
      // Actualizar configuración existente
      settings = await prisma.userSettings.update({
        where: { userId: session.user.id },
        data: {
          financeEnabled:
            financeEnabled !== undefined
              ? financeEnabled
              : settings.financeEnabled,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración" },
      { status: 500 }
    );
  }
}
