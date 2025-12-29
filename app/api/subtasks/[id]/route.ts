import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// PATCH /api/subtasks/[id] - Actualizar una subtarea (principalmente para toggle completed)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { completed, title } = body

    // Verificar que la subtarea existe y pertenece a un todo del usuario
    const existingSubtask = await prisma.subtask.findFirst({
      where: {
        id,
        todo: {
          userId: session.user.id
        }
      },
    })

    if (!existingSubtask) {
      return NextResponse.json(
        { error: "Subtarea no encontrada" },
        { status: 404 }
      )
    }

    const subtask = await prisma.subtask.update({
      where: { id },
      data: {
        ...(completed !== undefined && { completed }),
        ...(title !== undefined && { title }),
      },
    })

    return NextResponse.json(subtask)
  } catch (error) {
    console.error("Error updating subtask:", error)
    return NextResponse.json(
      { error: "Error al actualizar subtarea" },
      { status: 500 }
    )
  }
}

// DELETE /api/subtasks/[id] - Eliminar una subtarea
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verificar que la subtarea existe y pertenece a un todo del usuario
    const existingSubtask = await prisma.subtask.findFirst({
      where: {
        id,
        todo: {
          userId: session.user.id
        }
      },
    })

    if (!existingSubtask) {
      return NextResponse.json(
        { error: "Subtarea no encontrada" },
        { status: 404 }
      )
    }

    await prisma.subtask.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: "Subtarea eliminada exitosamente" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting subtask:", error)
    return NextResponse.json(
      { error: "Error al eliminar subtarea" },
      { status: 500 }
    )
  }
}