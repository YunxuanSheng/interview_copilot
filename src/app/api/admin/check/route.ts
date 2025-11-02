import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  
  if ("error" in authResult) {
    return authResult.error
  }

  return NextResponse.json({
    success: true,
    isAdmin: true,
    user: {
      id: authResult.user.id,
      email: authResult.user.email,
      role: authResult.user.role
    }
  })
}

