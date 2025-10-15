import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 点赞或取消点赞
export async function POST(
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
    const userId = session.user.id

    // 检查面试记录分享是否存在
    const sharing = await prisma.interviewSharing.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!sharing) {
      return NextResponse.json(
        { success: false, error: '面经不存在' },
        { status: 404 }
      )
    }

    // 检查是否已经点赞
    const existingLike = await prisma.interviewLike.findUnique({
      where: {
        userId_interviewSharingId: {
          userId,
          interviewSharingId: id
        }
      }
    })

    if (existingLike) {
      // 取消点赞
      await prisma.interviewLike.delete({
        where: {
          userId_interviewSharingId: {
            userId,
            interviewSharingId: id
          }
        }
      })

      // 更新点赞数
      await prisma.interviewSharing.update({
        where: { id },
        data: {
          likeCount: {
            decrement: 1
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          liked: false,
          message: '已取消点赞'
        }
      })
    } else {
      // 添加点赞
      await prisma.interviewLike.create({
        data: {
          userId,
          interviewSharingId: id
        }
      })

      // 更新点赞数
      await prisma.interviewSharing.update({
        where: { id },
        data: {
          likeCount: {
            increment: 1
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          liked: true,
          message: '已点赞'
        }
      })
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
    return NextResponse.json(
      { success: false, error: '点赞操作失败' },
      { status: 500 }
    )
  }
}

// 检查用户是否已点赞
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        data: { liked: false }
      })
    }

    const { id } = await params
    const userId = session.user.id

    const existingLike = await prisma.interviewLike.findUnique({
      where: {
        userId_interviewSharingId: {
          userId,
          interviewSharingId: id
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        liked: !!existingLike
      }
    })
  } catch (error) {
    console.error('检查点赞状态失败:', error)
    return NextResponse.json(
      { success: false, error: '检查点赞状态失败' },
      { status: 500 }
    )
  }
}
