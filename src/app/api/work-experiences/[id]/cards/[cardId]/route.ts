import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, cardId } = await params
    const body = await request.json()
    const { answer, status, tags, priority } = body

    // 验证卡片是否属于当前用户
    const card = await prisma.workExperienceCard.findFirst({
      where: {
        id: cardId,
        workExperience: {
          id: id,
          userId: session.user.id
        }
      }
    })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    // 更新卡片
    const updatedCard = await prisma.workExperienceCard.update({
      where: { id: cardId },
      data: {
        ...(answer !== undefined && { answer }),
        ...(status !== undefined && { status }),
        ...(tags !== undefined && { tags }),
        ...(priority !== undefined && { priority })
      }
    })

    return NextResponse.json({ card: updatedCard })
  } catch (error) {
    console.error("Update work experience card error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, cardId } = await params

    // 验证卡片是否属于当前用户
    const card = await prisma.workExperienceCard.findFirst({
      where: {
        id: cardId,
        workExperience: {
          id: id,
          userId: session.user.id
        }
      }
    })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    // 删除卡片
    await prisma.workExperienceCard.delete({
      where: { id: cardId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete work experience card error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
