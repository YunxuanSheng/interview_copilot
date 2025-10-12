import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 如果是demo用户，返回模拟数据
    if (session.user.email === "demo@example.com") {
      const mockRecords = [
        {
          id: "1",
          scheduleId: "3",
          audioFilePath: null,
          transcript: "面试官：你好，请先自我介绍一下。\n候选人：你好，我是张三，有3年Java开发经验，主要使用Spring框架开发过多个项目。\n面试官：能说说你对Spring的理解吗？\n候选人：Spring是一个轻量级的Java框架，提供了依赖注入和面向切面编程等功能...",
          aiAnalysis: JSON.stringify({
            strengths: ["技术基础扎实，对Spring有深入理解", "回答逻辑清晰，表达能力强", "有实际项目经验"],
            weaknesses: ["对微服务架构理解不够深入", "缺乏大型项目经验", "对性能优化方案不够全面"],
            suggestions: ["建议深入学习微服务架构相关知识", "可以尝试参与更大规模的项目", "多关注性能优化和最佳实践"]
          }),
          feedback: "整体表现良好，技术基础扎实，建议在微服务架构方面加强学习。",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          schedule: {
            company: "阿里巴巴",
            position: "Java开发工程师",
            interviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            round: 1
          },
          questions: [
            {
              id: "1",
              questionText: "请介绍一下Spring框架的核心特性",
              userAnswer: "Spring的核心特性包括依赖注入、面向切面编程、控制反转等...",
              aiEvaluation: "回答准确，理解深入，能够结合实际项目经验说明",
              questionType: "technical"
            },
            {
              id: "2",
              questionText: "如何优化Spring应用的性能？",
              userAnswer: "可以通过连接池配置、缓存使用、异步处理等方式优化...",
              aiEvaluation: "回答基本正确，但不够全面，缺少具体的优化策略",
              questionType: "technical"
            }
          ]
        },
        {
          id: "2",
          scheduleId: "5",
          audioFilePath: null,
          transcript: "面试官：你好，请介绍一下你的移动端开发经验。\n候选人：我有2年移动端开发经验，主要使用Flutter框架...\n面试官：能说说Flutter的优势吗？\n候选人：Flutter的优势包括跨平台开发、性能好、开发效率高等...",
          aiAnalysis: JSON.stringify({
            strengths: ["对Flutter框架有一定了解", "有移动端开发经验"],
            weaknesses: ["对原生开发了解不足", "缺乏复杂项目经验", "对性能优化理解不够"],
            suggestions: ["建议学习原生开发技术", "参与更复杂的移动端项目", "深入学习性能优化技巧"]
          }),
          feedback: "基础尚可，但需要加强原生开发能力和项目经验。",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          schedule: {
            company: "滴滴出行",
            position: "移动端开发工程师",
            interviewDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            round: 2
          },
          questions: [
            {
              id: "3",
              questionText: "Flutter和React Native的区别是什么？",
              userAnswer: "Flutter使用Dart语言，性能更好；React Native使用JavaScript...",
              aiEvaluation: "回答基本正确，但缺少具体的技术细节对比",
              questionType: "technical"
            }
          ]
        }
      ]
      return NextResponse.json(mockRecords)
    }

    const records = await prisma.interviewRecord.findMany({
      where: {
        schedule: {
          userId: session.user.id
        }
      },
      include: {
        schedule: {
          select: {
            company: true,
            position: true,
            interviewDate: true,
            round: true
          }
        },
        questions: {
          select: {
            id: true,
            questionText: true,
            userAnswer: true,
            aiEvaluation: true,
            questionType: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(records)
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      scheduleId,
      transcript,
      aiAnalysis,
      feedback,
      questions
    } = body

    const record = await prisma.interviewRecord.create({
      data: {
        scheduleId,
        transcript,
        aiAnalysis,
        feedback,
        questions: {
          create: questions?.map((q: {
            questionText: string
            userAnswer?: string
            aiEvaluation?: string
            questionType?: string
          }) => ({
            questionText: q.questionText,
            userAnswer: q.userAnswer,
            aiEvaluation: q.aiEvaluation,
            questionType: q.questionType
          })) || []
        }
      },
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

    return NextResponse.json(record)
  } catch (error) {
    console.error("Create interview record error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
