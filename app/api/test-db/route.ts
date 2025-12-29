import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

export async function GET() {
  try {
    // Try to query the database
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      success: true,
      message: "Database connection successful!"
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
