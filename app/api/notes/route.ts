import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// GET /api/notes - Obtener todas las notas del usuario
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        tags: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error("Error fetching notes:", error)
    return NextResponse.json(
      { error: "Error al obtener notas" },
      { status: 500 }
    )
  }
}

// POST /api/notes - Crear una nueva nota
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, content, type, tagIds } = body

    // Validaciones básicas
    if (!title || !content) {
      return NextResponse.json(
        { error: "Título y contenido son requeridos" },
        { status: 400 }
      )
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        type: type || "text",
        userId: session.user.id,
        tags: tagIds && tagIds.length > 0 ? {
          connect: tagIds.map((id: string) => ({ id }))
        } : undefined,
      },
      include: {
        tags: true,
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("Error creating note:", error)
    return NextResponse.json(
      { error: "Error al crear nota" },
      { status: 500 }
    )
  }
}
