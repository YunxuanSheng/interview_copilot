import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

// 类型断言辅助函数
const prismaAudioTask = prisma as any

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 如果是demo用户，返回模拟数据
    if (session.user.email === "demo@example.com") {
      const mockRecords = [
        {
          id: "1",
          company: "阿里巴巴",
          position: "Java开发工程师",
          interviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          round: 1,
          questions: [
            {
              id: "1",
              text: "请介绍一下Spring框架的核心特性",
              question: "请介绍一下Spring框架的核心特性",
              answer: "Spring的核心特性包括依赖注入、面向切面编程、控制反转等...",
              type: "technical"
            },
            {
              id: "2",
              text: "如何优化Spring应用的性能？",
              question: "如何优化Spring应用的性能？",
              answer: "可以通过连接池配置、缓存使用、异步处理等方式优化...",
              type: "technical"
            }
          ],
          answers: [
            { text: "Spring的核心特性包括依赖注入、面向切面编程、控制反转等..." },
            { text: "可以通过连接池配置、缓存使用、异步处理等方式优化..." }
          ],
          scheduleId: "3",
          audioFilePath: null,
          transcript: "面试官：你好，请先自我介绍一下。\n候选人：你好，我是张三，有3年Java开发经验，主要使用Spring框架开发过多个项目。\n面试官：能说说你对Spring的理解吗？\n候选人：Spring是一个轻量级的Java框架，提供了依赖注入和面向切面编程等功能...",
          aiAnalysis: JSON.stringify({
            strengths: ["技术基础扎实，对Spring有深入理解", "回答逻辑清晰，表达能力强", "有实际项目经验"],
            weaknesses: ["对微服务架构理解不够深入", "缺乏大型项目经验", "对性能优化方案不够全面"],
            suggestions: ["建议深入学习微服务架构相关知识", "可以尝试参与更大规模的项目", "多关注性能优化和最佳实践"]
          }),
          feedback: "整体表现良好，技术基础扎实，建议在微服务架构方面加强学习。",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "2",
          company: "滴滴出行",
          position: "移动端开发工程师",
          interviewDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          round: 2,
          questions: [
            {
              id: "3",
              text: "Flutter和React Native的区别是什么？",
              question: "Flutter和React Native的区别是什么？",
              answer: "Flutter使用Dart语言，性能更好；React Native使用JavaScript...",
              type: "technical"
            }
          ],
          answers: [
            { text: "Flutter使用Dart语言，性能更好；React Native使用JavaScript..." }
          ],
          scheduleId: "5",
          audioFilePath: null,
          transcript: "面试官：你好，请介绍一下你的移动端开发经验。\n候选人：我有2年移动端开发经验，主要使用Flutter框架...\n面试官：能说说Flutter的优势吗？\n候选人：Flutter的优势包括跨平台开发、性能好、开发效率高等...",
          aiAnalysis: JSON.stringify({
            strengths: ["对Flutter框架有一定了解", "有移动端开发经验"],
            weaknesses: ["对原生开发了解不足", "缺乏复杂项目经验", "对性能优化理解不够"],
            suggestions: ["建议学习原生开发技术", "参与更复杂的移动端项目", "深入学习性能优化技巧"]
          }),
          feedback: "基础尚可，但需要加强原生开发能力和项目经验。",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
      return NextResponse.json({ success: true, data: mockRecords })
    }

    // 查询所有与当前用户相关的面试记录
    // 1. 通过 schedule 关联的记录
    // 2. 没有 schedule 的记录（scheduleId 为 null）- 通过转录任务验证用户所有权
    const userId = session.user.id
    
    // 先查询所有可能的记录（有schedule或没有schedule）
    const allRecords = await prisma.interviewRecord.findMany({
      where: {
        OR: [
          // 有 schedule 且属于当前用户
          {
            schedule: {
              userId: userId
            }
          },
          // 没有 schedule 的记录（需要后续验证）
          {
            scheduleId: null as any
          }
        ]
      },
      include: {
        schedule: {
          select: {
            company: true,
            position: true,
            interviewDate: true,
            round: true,
            userId: true
          }
        },
        questions: {
          select: {
            id: true,
            questionText: true,
            userAnswer: true,
            aiEvaluation: true,
            recommendedAnswer: true,
            questionType: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    // 对于没有 schedule 的记录，需要通过转录任务验证用户所有权
    const validRecords: typeof allRecords = []
    for (const record of allRecords) {
      const recordWithSchedule = record as typeof record & { schedule: { userId: string } | null; questions: any[] }
      if (record.scheduleId && recordWithSchedule.schedule && recordWithSchedule.schedule.userId === userId) {
        // 有 schedule 且属于当前用户，直接添加
        validRecords.push(record)
      } else if (!record.scheduleId) {
        // 没有 schedule，检查转录任务
        if (record.transcript) {
          const matchingTask = await prismaAudioTask.audioTranscriptionTask.findFirst({
            where: {
              userId: userId,
              transcript: record.transcript,
              status: 'completed'
            },
            orderBy: {
              completedAt: 'desc'
            },
            take: 1
          })
          
          if (matchingTask) {
            validRecords.push(record)
          } else {
            // 如果没有匹配的转录任务，但记录是最近30分钟内创建的，也允许访问
            const recordAge = Date.now() - new Date(record.createdAt).getTime()
            const thirtyMinutes = 30 * 60 * 1000
            if (recordAge < thirtyMinutes) {
              validRecords.push(record)
            }
          }
        }
      }
    }
    
    const records = validRecords

    // 转换数据格式，将schedule字段提升到顶层
    const formattedRecords = records.map((record: any) => ({
      id: record.id,
      company: record.schedule?.company || "未知公司",
      position: record.schedule?.position || "未知职位",
      interviewDate: record.schedule?.interviewDate || record.createdAt,
      round: record.schedule?.round || 1,
      questions: (record.questions || []).map((q: any) => ({
        id: q.id,
        text: q.questionText,
        question: q.questionText,
        answer: q.userAnswer,
        type: q.questionType || 'technical'
      })),
      answers: (record.questions || []).map((q: any) => q.userAnswer ? { text: q.userAnswer } : null).filter(Boolean),
      scheduleId: record.scheduleId,
      audioFilePath: record.audioFilePath,
      transcript: record.transcript,
      aiAnalysis: record.aiAnalysis,
      overallScore: record.overallScore,
      feedback: record.feedback,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }))

    return NextResponse.json({ success: true, data: formattedRecords })
  } catch (error) {
    console.error("Interviews API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized",
        message: "请先登录"
      }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const {
      scheduleId,
      transcript,
      aiAnalysis,
      feedback,
      questions,
      taskId  // 新增：转录任务ID
    } = body

    // 处理 scheduleId：如果为空或 "skip"，则设为 null（可选）
    let finalScheduleId: string | null = null

    if (scheduleId && scheduleId !== 'skip' && scheduleId !== '') {
      // 验证 scheduleId 是否存在且属于当前用户
      const schedule = await prisma.interviewSchedule.findUnique({
        where: { id: scheduleId }
      })

      if (!schedule) {
        return NextResponse.json({
          success: false,
          error: "Schedule not found",
          message: "面试安排不存在"
        }, { status: 404 })
      }

      if (schedule.userId !== userId) {
        return NextResponse.json({
          success: false,
          error: "Forbidden",
          message: "无权访问此面试安排"
        }, { status: 403 })
      }

      finalScheduleId = scheduleId
    }

    // 检查是否存在匹配的记录（通过taskId或transcript）
    let existingRecord: any = null
    
    if (taskId && transcript) {
      // 通过taskId查找转录任务，然后通过transcript匹配记录
      const task = await prismaAudioTask.audioTranscriptionTask.findUnique({
        where: { id: taskId }
      })
      
      if (task && task.userId === userId && task.transcript) {
        // 查找匹配的面试记录
        existingRecord = await prisma.interviewRecord.findFirst({
          where: {
            transcript: {
              equals: task.transcript
            },
            OR: [
              // 有schedule且属于当前用户
              {
                schedule: {
                  userId: userId
                }
              },
              // 没有schedule但transcript匹配
              {
                scheduleId: null as any
              }
            ]
          },
          include: {
            schedule: {
              select: {
                userId: true
              }
            }
          }
        })
      }
    } else if (transcript) {
      // 没有taskId，直接通过transcript匹配
      existingRecord = await prisma.interviewRecord.findFirst({
        where: {
          transcript: {
            equals: transcript
          },
          OR: [
            // 有schedule且属于当前用户
            {
              schedule: {
                userId: userId
              }
            },
            // 没有schedule，需要通过转录任务验证
            {
              scheduleId: null as any
            }
          ]
        },
        include: {
          schedule: {
            select: {
              userId: true
            }
          }
        }
      })
      
      // 对于没有schedule的记录，验证是否属于当前用户（通过转录任务）
      if (existingRecord && !existingRecord.scheduleId) {
        const matchingTask = await prismaAudioTask.audioTranscriptionTask.findFirst({
          where: {
            userId: userId,
            transcript: {
              equals: transcript
            },
            status: 'completed'
          }
        })
        
        if (!matchingTask) {
          // 如果找不到匹配的转录任务，但记录是最近创建的，也允许更新
          const recordAge = Date.now() - new Date(existingRecord.createdAt).getTime()
          const thirtyMinutes = 30 * 60 * 1000
          if (recordAge >= thirtyMinutes) {
            existingRecord = null  // 时间太久，不允许更新
          }
        }
      } else if (existingRecord && existingRecord.scheduleId && existingRecord.schedule) {
        // 有schedule，验证是否属于当前用户
        if (existingRecord.schedule.userId !== userId) {
          existingRecord = null  // 不属于当前用户，不允许更新
        }
      }
    }

    // 如果找到匹配的记录且没有aiAnalysis（或需要更新），则更新记录
    if (existingRecord && (!existingRecord.aiAnalysis || aiAnalysis)) {
      // 使用事务更新记录和问题
      const updatedRecord = await prisma.$transaction(async (tx) => {
        // 更新面试记录
        await tx.interviewRecord.update({
          where: { id: existingRecord.id },
          data: {
            transcript: transcript || existingRecord.transcript,
            aiAnalysis: aiAnalysis || existingRecord.aiAnalysis,
            feedback: feedback !== undefined ? feedback : existingRecord.feedback,
            scheduleId: finalScheduleId !== null ? finalScheduleId : (existingRecord.scheduleId || undefined)
          }
        })

        // 删除现有问题
        await tx.interviewQuestion.deleteMany({
          where: { recordId: existingRecord.id }
        })

        // 创建新问题
        if (questions && questions.length > 0) {
          await tx.interviewQuestion.createMany({
            data: questions.map((q: {
              questionText: string
              userAnswer?: string
              aiEvaluation?: string
              recommendedAnswer?: string
              questionType?: string
            }) => ({
              recordId: existingRecord.id,
              questionText: q.questionText,
              userAnswer: q.userAnswer || null,
              aiEvaluation: q.aiEvaluation || null,
              recommendedAnswer: q.recommendedAnswer || null,
              questionType: q.questionType || null
            }))
          })
        }

        // 返回更新后的记录
        return await tx.interviewRecord.findUnique({
          where: { id: existingRecord.id },
          include: {
            schedule: {
              select: {
                company: true,
                position: true,
                interviewDate: true,
                round: true
              }
            },
            questions: true
          }
        })
      })

      return NextResponse.json({
        success: true,
        data: updatedRecord,
        updated: true  // 标识这是更新操作
      })
    }

    // 没有匹配的记录，创建新记录
    const createData: any = {
      transcript: transcript || null,
      aiAnalysis: aiAnalysis || null,
      feedback: feedback || null,
      questions: {
          create: questions?.map((q: {
            questionText: string
            userAnswer?: string
            aiEvaluation?: string
            recommendedAnswer?: string
            questionType?: string
          }) => ({
            questionText: q.questionText,
            userAnswer: q.userAnswer || null,
            aiEvaluation: q.aiEvaluation || null,
            recommendedAnswer: q.recommendedAnswer || null,
            questionType: q.questionType || null
          })) || []
      }
    }
    
    if (finalScheduleId) {
      createData.scheduleId = finalScheduleId
    }
    
    const record = await prisma.interviewRecord.create({
      data: createData,
      include: {
        schedule: {
          select: {
            company: true,
            position: true,
            interviewDate: true,
            round: true
          }
        },
        questions: true
      }
    })

    return NextResponse.json({
      success: true,
      data: record,
      updated: false  // 标识这是创建操作
    })
  } catch (error) {
    console.error("Create interview record error:", error)
    // 输出详细错误信息以便调试
    if (error instanceof Error) {
      console.error("错误详情:", error.message)
      console.error("错误堆栈:", error.stack)
    }
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      message: "创建面试记录失败，请稍后重试"
    }, { status: 500 })
  }
}
