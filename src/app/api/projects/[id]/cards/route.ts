import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

// 获取项目的所有卡片
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const status = searchParams.get("status")

    // 检查项目是否存在且属于当前用户
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }

    const whereClause: any = {
      projectId: params.id
    }

    if (category) {
      whereClause.category = category
    }

    if (status) {
      whereClause.status = status
    }

    const cards = await prisma.projectCard.findMany({
      where: whereClause,
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" }
      ]
    })

    return NextResponse.json({ cards })
  } catch (error) {
    console.error("Failed to fetch project cards:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 创建新卡片
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { category, question, answer, tags, priority } = body

    if (!category || !question) {
      return NextResponse.json(
        { error: "卡片分类和问题为必填项" },
        { status: 400 }
      )
    }

    // 检查项目是否存在且属于当前用户
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }

    const card = await prisma.projectCard.create({
      data: {
        projectId: params.id,
        category,
        question,
        answer: answer || null,
        tags: tags || null,
        priority: priority || 1,
        status: answer ? "answered" : "draft"
      }
    })

    return NextResponse.json({ card })
  } catch (error) {
    console.error("Failed to create project card:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
