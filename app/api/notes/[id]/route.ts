import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// GET /api/notes/[id] - Obtener una nota específica
export async function GET(
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

    const note = await prisma.note.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        tags: true,
      },
    })

    if (!note) {
      return NextResponse.json(
        { error: "Nota no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error("Error fetching note:", error)
    return NextResponse.json(
      { error: "Error al obtener nota" },
      { status: 500 }
    )
  }
}

// PATCH /api/notes/[id] - Actualizar una nota
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
    const { title, content, type, tagIds } = body

    // Verificar que la nota existe y pertenece al usuario
    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingNote) {
      return NextResponse.json(
        { error: "Nota no encontrada" },
        { status: 404 }
      )
    }

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
        ...(tagIds !== undefined && {
          tags: {
            set: tagIds.map((tagId: string) => ({ id: tagId }))
          }
        }),
      },
      include: {
        tags: true,
      },
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error("Error updating note:", error)
    return NextResponse.json(
      { error: "Error al actualizar nota" },
      { status: 500 }
    )
  }
}

// DELETE /api/notes/[id] - Eliminar una nota
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

    // Verificar que la nota existe y pertenece al usuario
    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingNote) {
      return NextResponse.json(
        { error: "Nota no encontrada" },
        { status: 404 }
      )
    }

    await prisma.note.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: "Nota eliminada exitosamente" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting note:", error)
    return NextResponse.json(
      { error: "Error al eliminar nota" },
      { status: 500 }
    )
  }
}
