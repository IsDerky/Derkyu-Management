import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// GET /api/events - Obtener todos los eventos del usuario
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const events = await prisma.event.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        tags: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json(
      { error: "Error al obtener eventos" },
      { status: 500 }
    )
  }
}

// POST /api/events - Crear un nuevo evento
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
    const { title, description, startTime, endTime, location, tagIds, isRecurring, recurrenceType, recurrenceEnd } = body

    // Validaciones básicas
    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Título, fecha de inicio y fecha de fin son requeridos" },
        { status: 400 }
      )
    }

    // Validar que endTime sea después de startTime
    if (new Date(endTime) <= new Date(startTime)) {
      return NextResponse.json(
        { error: "La fecha de fin debe ser posterior a la fecha de inicio" },
        { status: 400 }
      )
    }

    // Validar recurrencia si está habilitada
    if (isRecurring && !recurrenceType) {
      return NextResponse.json(
        { error: "Tipo de recurrencia es requerido si el evento es recurrente" },
        { status: 400 }
      )
    }

    // Si es un evento recurrente, generar múltiples instancias
    if (isRecurring && recurrenceType) {
      const events = []
      const start = new Date(startTime)
      const end = new Date(endTime)
      const finalDate = recurrenceEnd ? new Date(recurrenceEnd) : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 año por defecto
      const duration = end.getTime() - start.getTime()

      let currentDate = new Date(start)
      let iteration = 0
      const maxIterations = 365 // Límite de seguridad

      while (currentDate <= finalDate && iteration < maxIterations) {
        const eventStart = new Date(currentDate)
        const eventEnd = new Date(currentDate.getTime() + duration)

        events.push({
          title,
          description,
          startTime: eventStart,
          endTime: eventEnd,
          location,
          isRecurring: true,
          recurrenceType,
          recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
          userId: session.user.id,
        })

        // Calcular siguiente fecha según el tipo de recurrencia
        switch (recurrenceType) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1)
            break
          case 'weekdays':
            // Días laborables (Lun-Vie)
            do {
              currentDate.setDate(currentDate.getDate() + 1)
            } while (currentDate.getDay() === 0 || currentDate.getDay() === 6) // 0 = Domingo, 6 = Sábado
            break
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7)
            break
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1)
            break
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + 1)
            break
        }

        iteration++
      }

      // Crear todos los eventos de forma transaccional
      const createdEvents = await prisma.$transaction(
        events.map(eventData =>
          prisma.event.create({
            data: {
              ...eventData,
              tags: tagIds && tagIds.length > 0 ? {
                connect: tagIds.map((id: string) => ({ id }))
              } : undefined,
            },
            include: {
              tags: true,
            },
          })
        )
      )

      return NextResponse.json(createdEvents, { status: 201 })
    }

    // Evento único (no recurrente)
    const event = await prisma.event.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        isRecurring: false,
        recurrenceType: null,
        recurrenceEnd: null,
        userId: session.user.id,
        tags: tagIds && tagIds.length > 0 ? {
          connect: tagIds.map((id: string) => ({ id }))
        } : undefined,
      },
      include: {
        tags: true,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { error: "Error al crear evento" },
      { status: 500 }
    )
  }
}
