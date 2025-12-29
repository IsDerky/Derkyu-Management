import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// GET /api/tags/[id] - Obtener un tag específico
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

    const tag = await prisma.tag.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        events: {
          select: {
            id: true,
            title: true,
            startTime: true,
          }
        },
        notes: {
          select: {
            id: true,
            title: true,
            updatedAt: true,
          }
        },
        todos: {
          select: {
            id: true,
            title: true,
            completed: true,
          }
        },
        _count: {
          select: {
            events: true,
            notes: true,
            todos: true,
          }
        }
      },
    })

    if (!tag) {
      return NextResponse.json(
        { error: "Etiqueta no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(tag)
  } catch (error) {
    console.error("Error fetching tag:", error)
    return NextResponse.json(
      { error: "Error al obtener etiqueta" },
      { status: 500 }
    )
  }
}

// PATCH /api/tags/[id] - Actualizar un tag
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
    const { name, color } = body

    // Verificar que el tag existe y pertenece al usuario
    const existingTag = await prisma.tag.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingTag) {
      return NextResponse.json(
        { error: "Etiqueta no encontrada" },
        { status: 404 }
      )
    }

    // Si se está actualizando el nombre, verificar que no esté duplicado
    if (name && name.trim() !== existingTag.name) {
      const duplicateTag = await prisma.tag.findFirst({
        where: {
          userId: session.user.id,
          name: name.trim(),
          NOT: {
            id,
          }
        },
      })

      if (duplicateTag) {
        return NextResponse.json(
          { error: "Ya existe una etiqueta con ese nombre" },
          { status: 400 }
        )
      }
    }

    // Validar color si se proporciona
    if (color) {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      if (!colorRegex.test(color)) {
        return NextResponse.json(
          { error: "Color inválido. Debe ser un color hexadecimal (ej: #3b82f6)" },
          { status: 400 }
        )
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
      },
      include: {
        _count: {
          select: {
            events: true,
            notes: true,
            todos: true,
          }
        }
      },
    })

    return NextResponse.json(tag)
  } catch (error) {
    console.error("Error updating tag:", error)
    return NextResponse.json(
      { error: "Error al actualizar etiqueta" },
      { status: 500 }
    )
  }
}

// DELETE /api/tags/[id] - Eliminar un tag
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

    // Verificar que el tag existe y pertenece al usuario
    const existingTag = await prisma.tag.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingTag) {
      return NextResponse.json(
        { error: "Etiqueta no encontrada" },
        { status: 404 }
      )
    }

    // Eliminar el tag (las relaciones se manejan automáticamente)
    await prisma.tag.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: "Etiqueta eliminada exitosamente" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting tag:", error)
    return NextResponse.json(
      { error: "Error al eliminar etiqueta" },
      { status: 500 }
    )
  }
}
