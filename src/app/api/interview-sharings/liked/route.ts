import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 获取用户点赞过的面试记录分享列表
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
    const company = searchParams.get('company')
    const position = searchParams.get('position')
    const difficulty = searchParams.get('difficulty')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const userId = session.user.id

    // 构建基础查询条件
    const where: any = {
      isPublic: true,
      likes: {
        some: {
          userId: userId
        }
      }
    }

    // 添加搜索条件
    if (company) {
      where.company = {
        contains: company,
        mode: 'insensitive'
      }
    }

    if (position) {
      where.position = {
        contains: position,
        mode: 'insensitive'
      }
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    const [sharings, total] = await Promise.all([
      prisma.interviewSharing.findMany({
        where,
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
      prisma.interviewSharing.count({ where })
    ])

    // 更新点赞数
    const sharingsWithLikes = sharings.map(sharing => ({
      ...sharing,
      likeCount: sharing._count.likes
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
    console.error('获取点赞的面经失败:', error)
    return NextResponse.json(
      { success: false, error: '获取点赞的面经失败' },
      { status: 500 }
    )
  }
}
