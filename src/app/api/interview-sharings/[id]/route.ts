import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 获取单个面试记录分享详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const sharing = await prisma.interviewSharing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            likes: true
          }
        }
      }
    })

    if (!sharing) {
      return NextResponse.json(
        { success: false, error: '面经不存在' },
        { status: 404 }
      )
    }

    // 增加浏览次数
    await prisma.interviewSharing.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1
        }
      }
    })

    const sharingWithLikes = {
      ...sharing,
      likeCount: sharing._count.likes,
      questions: JSON.parse(sharing.questions),
      answers: sharing.answers ? JSON.parse(sharing.answers) : null
    }

    return NextResponse.json({
      success: true,
      data: sharingWithLikes
    })
  } catch (error) {
    console.error('获取面经详情失败:', error)
    return NextResponse.json(
      { success: false, error: '获取面经详情失败' },
      { status: 500 }
    )
  }
}

// 更新面试记录分享
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // 检查是否是作者
    const existingSharing = await prisma.interviewSharing.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existingSharing) {
      return NextResponse.json(
        { success: false, error: '面经不存在' },
        { status: 404 }
      )
    }

    if (existingSharing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: '无权限修改此分享' },
        { status: 403 }
      )
    }

    const updateData: any = {}
    if (body.company) updateData.company = body.company
    if (body.position) updateData.position = body.position
    if (body.department !== undefined) updateData.department = body.department
    if (body.interviewDate) updateData.interviewDate = new Date(body.interviewDate)
    if (body.round !== undefined) updateData.round = body.round
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty
    if (body.experience !== undefined) updateData.experience = body.experience
    if (body.questions) updateData.questions = JSON.stringify(body.questions)
    if (body.answers !== undefined) updateData.answers = body.answers ? JSON.stringify(body.answers) : null
    if (body.tips !== undefined) updateData.tips = body.tips
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic

    const updatedSharing = await prisma.interviewSharing.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedSharing
    })
  } catch (error) {
    console.error('更新面经失败:', error)
    return NextResponse.json(
      { success: false, error: '更新面经失败' },
      { status: 500 }
    )
  }
}

// 删除面试记录分享
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 }
      )
    }

    const { id } = await params

    // 检查是否是作者
    const existingSharing = await prisma.interviewSharing.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existingSharing) {
      return NextResponse.json(
        { success: false, error: '面经不存在' },
        { status: 404 }
      )
    }

    if (existingSharing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: '无权限删除此分享' },
        { status: 403 }
      )
    }

    await prisma.interviewSharing.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: '面经已删除'
    })
  } catch (error) {
    console.error('删除面经失败:', error)
    return NextResponse.json(
      { success: false, error: '删除面经失败' },
      { status: 500 }
    )
  }
}
