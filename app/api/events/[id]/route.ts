import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// GET /api/events/[id] - Obtener un evento específico
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

    const event = await prisma.event.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        tags: true,
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json(
      { error: "Error al obtener evento" },
      { status: 500 }
    )
  }
}

// PATCH /api/events/[id] - Actualizar un evento
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
    const { title, description, startTime, endTime, location, tagIds, isRecurring, recurrenceType, recurrenceEnd } = body

    // Verificar que el evento existe y pertenece al usuario
    const existingEvent = await prisma.event.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      )
    }

    // Validar fechas si se proporcionan
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      return NextResponse.json(
        { error: "La fecha de fin debe ser posterior a la fecha de inicio" },
        { status: 400 }
      )
    }

    // Validar recurrencia si está habilitada
    if (isRecurring === true && !recurrenceType) {
      return NextResponse.json(
        { error: "Tipo de recurrencia es requerido si el evento es recurrente" },
        { status: 400 }
      )
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(startTime !== undefined && { startTime: new Date(startTime) }),
        ...(endTime !== undefined && { endTime: new Date(endTime) }),
        ...(location !== undefined && { location }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurrenceType !== undefined && { recurrenceType: isRecurring ? recurrenceType : null }),
        ...(recurrenceEnd !== undefined && { recurrenceEnd: isRecurring && recurrenceEnd ? new Date(recurrenceEnd) : null }),
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

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json(
      { error: "Error al actualizar evento" },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id] - Eliminar un evento
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

    // Verificar que el evento existe y pertenece al usuario
    const existingEvent = await prisma.event.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      )
    }

    await prisma.event.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: "Evento eliminado exitosamente" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { error: "Error al eliminar evento" },
      { status: 500 }
    )
  }
}
