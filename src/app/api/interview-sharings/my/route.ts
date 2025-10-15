import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 获取用户自己的面试记录分享
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [sharings, total] = await Promise.all([
      prisma.interviewSharing.findMany({
        where: {
          userId: session.user.id
        },
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.interviewSharing.count({
        where: {
          userId: session.user.id
        }
      })
    ])

    // 更新点赞数
    const sharingsWithLikes = sharings.map(sharing => ({
      ...sharing,
      likeCount: sharing._count.likes,
      questions: JSON.parse(sharing.questions),
      answers: sharing.answers ? JSON.parse(sharing.answers) : null
    }))

    return NextResponse.json({
      success: true,
      data: {
        sharings: sharingsWithLikes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取我的面经失败:', error)
    return NextResponse.json(
      { success: false, error: '获取我的面经失败' },
      { status: 500 }
    )
  }
}
