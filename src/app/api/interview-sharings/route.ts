import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 获取面试记录分享列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const company = searchParams.get('company')
    const position = searchParams.get('position')
    const difficulty = searchParams.get('difficulty')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {
      isPublic: true
    }

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
    console.error('获取面试记录分享失败:', error)
    return NextResponse.json(
      { success: false, error: '获取面经失败' },
      { status: 500 }
    )
  }
}

// 创建面试记录分享
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('收到面试分享请求:', JSON.stringify(body, null, 2))
    
    const {
      interviewRecordId,
      company,
      position,
      department,
      interviewDate,
      round,
      difficulty,
      experience,
      questions,
      answers,
      tips,
      tags,
      isPublic = true,
      // 隐私设置
      selectedQuestions,
      enableAnswerSharing = false,
      enablePersonalInfo = false,
      isAnonymous = true // 默认匿名
    } = body

    // 验证必填字段
    if (!company || !position || !questions) {
      return NextResponse.json(
        { success: false, error: '公司、职位和问题为必填项' },
        { status: 400 }
      )
    }

    console.log('准备创建面试分享记录...')
    const sharingData = {
      userId: session.user.id,
      interviewRecordId,
      company,
      position,
      department,
      interviewDate: interviewDate ? new Date(interviewDate) : null,
      round: round || 1,
      difficulty,
      experience,
      questions: JSON.stringify(questions),
      answers: answers ? JSON.stringify(answers) : null,
      tips,
      tags,
      isPublic,
      // 隐私设置
      selectedQuestions: selectedQuestions ? JSON.stringify(selectedQuestions) : null,
      enableAnswerSharing,
      enablePersonalInfo,
      isAnonymous
    }
    console.log('分享数据:', JSON.stringify(sharingData, null, 2))
    
    const sharing = await prisma.interviewSharing.create({
      data: sharingData,
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
    console.log('面试分享记录创建成功:', sharing.id)

    return NextResponse.json({
      success: true,
      data: sharing
    })
  } catch (error) {
    console.error('创建面试记录分享失败:', error)
    return NextResponse.json(
      { success: false, error: '发布面经失败' },
      { status: 500 }
    )
  }
}
