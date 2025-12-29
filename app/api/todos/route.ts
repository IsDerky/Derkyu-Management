import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// GET /api/todos - Obtener todos los todos del usuario
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const todos = await prisma.todo.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        tags: true,
        subtasks: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' },
      ],
    })

    return NextResponse.json(todos)
  } catch (error) {
    console.error("Error fetching todos:", error)
    return NextResponse.json(
      { error: "Error al obtener tareas" },
      { status: 500 }
    )
  }
}

// POST /api/todos - Crear un nuevo todo
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
    const { title, description, completed, priority, status, dueDate, tagIds, subtasks } = body

    // Validaciones básicas
    if (!title) {
      return NextResponse.json(
        { error: "El título es requerido" },
        { status: 400 }
      )
    }

    // Validar priority si se proporciona
    if (priority && !['alta', 'media', 'baja'].includes(priority)) {
      return NextResponse.json(
        { error: "Prioridad inválida. Debe ser: alta, media o baja" },
        { status: 400 }
      )
    }

    // Validar status si se proporciona
    if (status && !['todo', 'in_progress', 'done'].includes(status)) {
      return NextResponse.json(
        { error: "Estado inválido. Debe ser: todo, in_progress o done" },
        { status: 400 }
      )
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        description,
        completed: completed ?? false,
        priority,
        status: status ?? 'todo',
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: session.user.id,
        tags: tagIds && tagIds.length > 0 ? {
          connect: tagIds.map((id: string) => ({ id }))
        } : undefined,
        subtasks: subtasks && subtasks.length > 0 ? {
          create: subtasks.map((subtask: { title: string }, index: number) => ({
            title: subtask.title,
            order: index,
            completed: false
          }))
        } : undefined
      },
      include: {
        tags: true,
        subtasks: {
          orderBy: {
            order: 'asc'
          }
        }
      },
    })

    return NextResponse.json(todo, { status: 201 })
  } catch (error) {
    console.error("Error creating todo:", error)
    return NextResponse.json(
      { error: "Error al crear tarea" },
      { status: 500 }
    )
  }
}