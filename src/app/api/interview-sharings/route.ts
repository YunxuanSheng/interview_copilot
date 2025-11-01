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
    if (!company || !position) {
      return NextResponse.json(
        { success: false, error: '公司、职位为必填项' },
        { status: 400 }
      )
    }

    // 验证问题数组
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: '至少需要选择一个问题进行分享' },
        { status: 400 }
      )
    }

    // 验证并格式化问题数据
    let questionsString: string
    try {
      // 确保每个问题都有有效的文本内容
      // 统一处理：无论是字符串还是对象，都提取文本内容
      const formattedQuestions = questions.map((q: any, index: number) => {
        let text = ''
        if (typeof q === 'string') {
          text = q.trim()
        } else if (q && typeof q === 'object') {
          // 处理对象格式的问题
          text = (q.text || q.question || '').trim()
        } else {
          console.warn(`问题 ${index} 格式无效:`, q)
        }
        
        if (!text || text.length === 0) {
          console.warn(`问题 ${index} 内容为空，已跳过`)
          return null
        }
        
        // 统一返回字符串格式的问题文本
        return text
      }).filter((q: string | null): q is string => q !== null && q.trim().length > 0)
      
      if (formattedQuestions.length === 0) {
        return NextResponse.json(
          { success: false, error: '问题内容不能为空' },
          { status: 400 }
        )
      }
      
      // 将问题数组转换为 JSON 字符串
      questionsString = JSON.stringify(formattedQuestions)
      
      // 验证 JSON 字符串是否有效
      if (!questionsString || questionsString.length === 0) {
        throw new Error('问题 JSON 序列化失败')
      }
    } catch (error) {
      console.error('问题数据格式化失败:', error)
      return NextResponse.json(
        { success: false, error: `问题数据格式错误: ${error instanceof Error ? error.message : '未知错误'}` },
        { status: 400 }
      )
    }

    console.log('准备创建面试分享记录...')
    
    // 确保 round 始终是有效的整数，不能为 null
    let roundValue = 1
    if (round !== null && round !== undefined) {
      const parsed = parseInt(String(round))
      if (!isNaN(parsed) && parsed > 0) {
        roundValue = parsed
      }
    }
    
    // 处理 interviewDate
    let interviewDateValue: Date | null = null
    if (interviewDate) {
      try {
        const date = new Date(interviewDate)
        if (!isNaN(date.getTime())) {
          interviewDateValue = date
        }
      } catch (error) {
        console.warn('日期格式错误:', interviewDate, error)
      }
    }
    
    const sharingData = {
      userId: session.user.id,
      interviewRecordId: interviewRecordId || null,
      company,
      position,
      department: department || null,
      interviewDate: interviewDateValue,
      round: roundValue, // 确保是整数，不能为 null
      difficulty: difficulty || null,
      experience: experience || null,
      questions: questionsString,
      answers: answers && Array.isArray(answers) && answers.length > 0 ? JSON.stringify(answers) : null,
      tips: tips || null,
      tags: tags || null,
      isPublic: typeof isPublic === 'boolean' ? isPublic : true,
      // 隐私设置
      selectedQuestions: selectedQuestions && Array.isArray(selectedQuestions) && selectedQuestions.length > 0 
        ? JSON.stringify(selectedQuestions) 
        : null,
      enableAnswerSharing: typeof enableAnswerSharing === 'boolean' ? enableAnswerSharing : false,
      enablePersonalInfo: typeof enablePersonalInfo === 'boolean' ? enablePersonalInfo : false,
      isAnonymous: typeof isAnonymous === 'boolean' ? isAnonymous : true
    }
    console.log('分享数据:', JSON.stringify(sharingData, null, 2))
    console.log('数据类型检查:', {
      round: typeof sharingData.round,
      roundValue: sharingData.round,
      interviewDate: typeof sharingData.interviewDate,
      interviewDateValue: sharingData.interviewDate,
      questions: typeof sharingData.questions,
      questionsLength: sharingData.questions?.length
    })
    
    try {
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
    } catch (prismaError: any) {
      console.error('Prisma 创建失败:', {
        code: prismaError.code,
        meta: prismaError.meta,
        message: prismaError.message,
        sharingData: JSON.stringify(sharingData, null, 2)
      })
      throw prismaError
    }

  } catch (error) {
    console.error('创建面试记录分享失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('详细错误信息:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    })
    
    // 如果是 Prisma 错误，提供更详细的信息
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: '数据已存在，请勿重复提交' },
          { status: 400 }
        )
      }
      if (prismaError.code === 'P2003') {
        return NextResponse.json(
          { success: false, error: '关联数据不存在' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { success: false, error: `发布面经失败: ${errorMessage}` },
      { status: 500 }
    )
  }
}
