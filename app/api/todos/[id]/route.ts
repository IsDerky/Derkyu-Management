import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// GET /api/todos/[id] - Obtener un todo específico
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

    const todo = await prisma.todo.findFirst({
      where: {
        id,
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
    })

    if (!todo) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(todo)
  } catch (error) {
    console.error("Error fetching todo:", error)
    return NextResponse.json(
      { error: "Error al obtener tarea" },
      { status: 500 }
    )
  }
}

// PATCH /api/todos/[id] - Actualizar un todo
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
    const { title, description, completed, priority, status, dueDate, tagIds, subtasks } = body

    // Verificar que el todo existe y pertenece al usuario
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingTodo) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      )
    }

    // Validar priority si se proporciona
    if (priority !== undefined && priority !== null && !['alta', 'media', 'baja'].includes(priority)) {
      return NextResponse.json(
        { error: "Prioridad inválida. Debe ser: alta, media o baja" },
        { status: 400 }
      )
    }

    // Validar status si se proporciona
    if (status !== undefined && status !== null && !['todo', 'in_progress', 'done'].includes(status)) {
      return NextResponse.json(
        { error: "Estado inválido. Debe ser: todo, in_progress o done" },
        { status: 400 }
      )
    }

    // Si se actualiza el status a 'done', marcar como completed
    const updateData: any = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(completed !== undefined && { completed }),
      ...(priority !== undefined && { priority }),
      ...(status !== undefined && { status }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(tagIds !== undefined && {
        tags: {
          set: tagIds.map((tagId: string) => ({ id: tagId }))
        }
      }),
    }

    // Si el status cambia a 'done', marcar como completed
    if (status === 'done' && completed === undefined) {
      updateData.completed = true
    }

    // Si el status cambia de 'done', marcar como no completed
    if (status && status !== 'done' && completed === undefined) {
      updateData.completed = false
    }

    // Manejar subtasks si se proporcionan
    if (subtasks !== undefined) {
      // Eliminar subtasks existentes
      await prisma.subtask.deleteMany({
        where: { todoId: id }
      })

      // Crear nuevas subtasks
      if (subtasks.length > 0) {
        updateData.subtasks = {
          create: subtasks.map((subtask: { title: string, completed?: boolean }, index: number) => ({
            title: subtask.title,
            completed: subtask.completed ?? false,
            order: index
          }))
        }
      }
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: updateData,
      include: {
        tags: true,
        subtasks: {
          orderBy: {
            order: 'asc'
          }
        }
      },
    })

    return NextResponse.json(todo)
  } catch (error) {
    console.error("Error updating todo:", error)
    return NextResponse.json(
      { error: "Error al actualizar tarea" },
      { status: 500 }
    )
  }
}

// DELETE /api/todos/[id] - Eliminar un todo
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

    // Verificar que el todo existe y pertenece al usuario
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingTodo) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      )
    }

    await prisma.todo.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: "Tarea eliminada exitosamente" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting todo:", error)
    return NextResponse.json(
      { error: "Error al eliminar tarea" },
      { status: 500 }
    )
  }
}