import { NextRequest, NextResponse } from "next/server"
import { checkDatabaseConnection } from "@/lib/prisma"

export async function GET(_request: NextRequest) {
  try {
    const dbConnected = await checkDatabaseConnection()
    
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbConnected ? "connected" : "disconnected",
      environment: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
