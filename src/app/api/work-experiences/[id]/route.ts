import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const workExperience = await prisma.workExperience.findFirst({
      where: {
        id: id,
        userId: session.user.id
      },
      include: {
        cards: {
          orderBy: {
            priority: "desc"
          }
        }
      }
    })

    if (!workExperience) {
      return NextResponse.json({ error: "Work experience not found" }, { status: 404 })
    }

    return NextResponse.json({ workExperience })
  } catch (error) {
    console.error("Get work experience error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
