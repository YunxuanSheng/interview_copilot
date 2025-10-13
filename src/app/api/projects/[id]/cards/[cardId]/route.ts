import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

// 更新卡片
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { question, answer, status, tags, priority, aiSuggestion } = body
    const resolvedParams = await params

    // 检查卡片是否存在且属于当前用户的项目
    const existingCard = await prisma.projectCard.findFirst({
      where: {
        id: resolvedParams.cardId,
        project: {
          userId: session.user.id
        }
      }
    })

    if (!existingCard) {
      return NextResponse.json({ error: "卡片不存在" }, { status: 404 })
    }

    const card = await prisma.projectCard.update({
      where: {
        id: resolvedParams.cardId
      },
      data: {
        question: question || existingCard.question,
        answer: answer !== undefined ? answer : existingCard.answer,
        status: status || existingCard.status,
        tags: tags !== undefined ? tags : existingCard.tags,
        priority: priority || existingCard.priority,
        aiSuggestion: aiSuggestion !== undefined ? aiSuggestion : existingCard.aiSuggestion
      }
    })

    return NextResponse.json({ card })
  } catch (error) {
    console.error("Failed to update project card:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 删除卡片
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params

    // 检查卡片是否存在且属于当前用户的项目
    const existingCard = await prisma.projectCard.findFirst({
      where: {
        id: resolvedParams.cardId,
        project: {
          userId: session.user.id
        }
      }
    })

    if (!existingCard) {
      return NextResponse.json({ error: "卡片不存在" }, { status: 404 })
    }

    await prisma.projectCard.delete({
      where: {
        id: resolvedParams.cardId
      }
    })

    return NextResponse.json({ message: "卡片删除成功" })
  } catch (error) {
    console.error("Failed to delete project card:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
