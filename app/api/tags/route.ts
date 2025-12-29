import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// GET /api/tags - Obtener todos los tags del usuario
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const tags = await prisma.tag.findMany({
      where: {
        userId: session.user.id,
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
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json(
      { error: "Error al obtener etiquetas" },
      { status: 500 }
    )
  }
}

// POST /api/tags - Crear un nuevo tag
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
    const { name, color } = body

    // Validaciones básicas
    if (!name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      )
    }

    // Validar que el nombre no esté duplicado para este usuario
    const existingTag = await prisma.tag.findFirst({
      where: {
        userId: session.user.id,
        name: name.trim(),
      },
    })

    if (existingTag) {
      return NextResponse.json(
        { error: "Ya existe una etiqueta con ese nombre" },
        { status: 400 }
      )
    }

    // Validar color (debe ser un color hex válido)
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (color && !colorRegex.test(color)) {
      return NextResponse.json(
        { error: "Color inválido. Debe ser un color hexadecimal (ej: #3b82f6)" },
        { status: 400 }
      )
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        color: color || "#3b82f6",
        userId: session.user.id,
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

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error("Error creating tag:", error)
    return NextResponse.json(
      { error: "Error al crear etiqueta" },
      { status: 500 }
    )
  }
}
