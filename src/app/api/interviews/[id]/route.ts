import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

// 获取单个面试记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const recordId = params.id

    // 如果是demo用户，返回模拟数据
    if (session.user.email === "demo@example.com") {
      const mockRecords = [
        {
          id: "1",
          scheduleId: "3",
          audioFilePath: null,
          transcript: "面试官：你好，请先自我介绍一下。\n候选人：你好，我是张三，有3年Java开发经验，主要使用Spring框架开发过多个项目。\n面试官：能说说你对Spring的理解吗？\n候选人：Spring是一个轻量级的Java框架，提供了依赖注入和面向切面编程等功能。我在项目中主要使用Spring Boot来快速搭建微服务应用，通过@Autowired注解实现依赖注入，使用@Transactional注解管理事务。\n面试官：你在项目中遇到过哪些性能问题，是如何解决的？\n候选人：在之前的电商项目中，我们遇到了高并发下的数据库查询性能问题。我通过添加数据库索引、使用Redis缓存、优化SQL查询语句等方式来解决。具体来说，我为经常查询的字段添加了复合索引，将热点数据缓存到Redis中，并使用了连接池来管理数据库连接。\n面试官：你对微服务架构有什么了解？\n候选人：微服务架构是将单体应用拆分为多个独立的服务，每个服务负责特定的业务功能。我在项目中使用Spring Cloud来实现微服务，包括服务注册与发现、配置中心、网关等功能。微服务的优势是提高了系统的可扩展性和可维护性，但也带来了分布式事务、服务间通信等挑战。",
          aiAnalysis: JSON.stringify({
            strengths: [
              "技术基础扎实，对Spring框架有深入理解",
              "回答逻辑清晰，表达能力强",
              "有实际项目经验，能够结合具体场景说明",
              "对微服务架构有一定了解",
              "能够主动提及技术细节和实现方案"
            ],
            weaknesses: [
              "对微服务架构的理解还不够深入",
              "缺乏大型分布式系统的实际经验",
              "对性能优化的方案描述不够具体",
              "对新技术的学习和应用能力需要提升"
            ],
            suggestions: [
              "建议深入学习微服务架构的相关技术，如服务治理、分布式事务等",
              "可以尝试参与更大规模的项目，积累分布式系统开发经验",
              "多关注性能优化和系统架构设计的最佳实践",
              "建议学习一些新兴技术，如云原生、容器化等"
            ]
          }),
          feedback: "整体表现良好，技术基础扎实，对Spring框架有深入理解。回答问题时逻辑清晰，能够结合具体项目经验进行说明。建议在微服务架构和大型系统设计方面加强学习，提升对分布式系统的理解。",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
              userAnswer: "Spring的核心特性包括依赖注入、面向切面编程、控制反转等。我在项目中主要使用Spring Boot来快速搭建微服务应用，通过@Autowired注解实现依赖注入，使用@Transactional注解管理事务。Spring还提供了丰富的生态，如Spring Security、Spring Data等。",
              aiEvaluation: "回答准确，理解深入，能够结合实际项目经验说明。对Spring的核心概念掌握良好，能够提及具体的使用场景和注解。建议可以进一步说明Spring的IoC容器工作原理。",
              questionType: "technical"
            },
            {
              id: "2",
              questionText: "如何优化Spring应用的性能？",
              userAnswer: "可以通过连接池配置、缓存使用、异步处理等方式优化。具体来说，我为经常查询的字段添加了复合索引，将热点数据缓存到Redis中，并使用了连接池来管理数据库连接。还可以使用@Async注解实现异步处理。",
              aiEvaluation: "回答基本正确，但不够全面。提到了数据库优化和缓存，但缺少对Spring应用本身的优化策略，如Bean的作用域、循环依赖处理等。建议补充更多Spring特有的优化方法。",
              questionType: "technical"
            },
            {
              id: "4",
              questionText: "请实现一个两数之和的算法",
              userAnswer: "我使用哈希表来解决这个问题。算法思路是遍历数组，对于每个元素计算目标值与当前元素的差值，如果这个差值在哈希表中存在，则找到了答案。\n\n```python\ndef twoSum(nums, target):\n    hashmap = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in hashmap:\n            return [hashmap[complement], i]\n        hashmap[num] = i\n    return []\n```\n\n时间复杂度是 `O(n)`，空间复杂度也是 `O(n)`。",
              aiEvaluation: "算法实现正确，使用了哈希表优化查找效率。代码逻辑清晰，时间复杂度分析准确。建议可以进一步说明为什么选择哈希表而不是暴力解法。",
              questionType: "algorithm"
            },
            {
              id: "3",
              questionText: "描述一次你在项目中遇到的最大挑战，以及你是如何解决的？",
              userAnswer: "在之前的电商项目中，我们遇到了高并发下的性能问题。我通过分析发现是数据库查询效率低下导致的。我采用了数据库索引优化、查询语句优化、以及引入Redis缓存等方式，最终将响应时间从2秒降低到200毫秒。",
              aiEvaluation: "使用了STAR方法，情况描述清楚，解决方案具体有效。能够量化改进效果，体现了良好的问题分析和解决能力。建议可以进一步说明在优化过程中遇到的困难和如何克服的。",
              questionType: "behavioral"
            }
          ]
        },
        {
          id: "2",
          scheduleId: "5",
          audioFilePath: null,
          transcript: "面试官：你好，请介绍一下你的移动端开发经验。\n候选人：我有2年移动端开发经验，主要使用Flutter框架开发跨平台应用。\n面试官：能说说Flutter的优势吗？\n候选人：Flutter的优势包括跨平台开发、性能好、开发效率高等。使用Dart语言开发，一套代码可以同时运行在iOS和Android平台上。\n面试官：Flutter和React Native有什么区别？\n候选人：Flutter使用Dart语言，性能更好；React Native使用JavaScript，生态更丰富。Flutter的渲染性能更好，但React Native的社区支持更广泛。\n面试官：你在移动端开发中遇到过哪些性能问题？\n候选人：主要是内存泄漏和渲染性能问题。我通过使用ListView.builder优化长列表，避免在build方法中创建新对象来解决。",
          aiAnalysis: JSON.stringify({
            strengths: [
              "对Flutter框架有一定了解",
              "有移动端开发经验",
              "能够对比不同技术方案"
            ],
            weaknesses: [
              "对原生开发了解不足",
              "缺乏复杂项目经验",
              "对性能优化的理解不够深入",
              "技术深度有待提升"
            ],
            suggestions: [
              "建议学习原生开发技术，了解iOS和Android的底层原理",
              "参与更复杂的移动端项目，积累更多实战经验",
              "深入学习性能优化技巧，如内存管理、渲染优化等",
              "关注移动端新技术趋势，如Kotlin Multiplatform等"
            ]
          }),
          feedback: "基础尚可，对Flutter有一定了解，但技术深度不够。建议加强原生开发能力和项目经验，提升对移动端性能优化的理解。",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
              userAnswer: "Flutter使用Dart语言，性能更好；React Native使用JavaScript，生态更丰富。Flutter的渲染性能更好，但React Native的社区支持更广泛。",
              aiEvaluation: "回答基本正确，但缺少具体的技术细节对比。建议可以进一步说明渲染机制、开发体验、包大小等方面的差异。",
              questionType: "technical"
            },
            {
              id: "4",
              questionText: "如何优化Flutter应用的性能？",
              userAnswer: "主要是内存泄漏和渲染性能问题。我通过使用ListView.builder优化长列表，避免在build方法中创建新对象来解决。",
              aiEvaluation: "提到了基本的优化方法，但不够全面。缺少对Widget树优化、图片优化、网络优化等方面的说明。建议深入学习Flutter的性能优化最佳实践。",
              questionType: "technical"
            }
          ]
        },
        {
          id: "3",
          scheduleId: "7",
          audioFilePath: null,
          transcript: "面试官：你好，请先自我介绍一下。\n候选人：你好，我是李四，有5年全栈开发经验，主要使用React和Node.js开发Web应用。\n面试官：能说说你对前端性能优化的理解吗？\n候选人：前端性能优化主要包括代码分割、懒加载、缓存策略、CDN使用等。我在项目中使用了React.lazy进行代码分割，通过Webpack的SplitChunksPlugin优化打包。\n面试官：你了解哪些前端框架，它们有什么特点？\n候选人：我主要使用React，也了解Vue和Angular。React的特点是组件化、虚拟DOM、单向数据流；Vue更易上手，模板语法直观；Angular功能完整但学习曲线陡峭。\n面试官：你在项目中是如何处理状态管理的？\n候选人：我使用Redux进行状态管理，通过action、reducer、store来管理应用状态。对于简单状态使用useState，复杂状态使用useReducer或Redux。",
          aiAnalysis: JSON.stringify({
            strengths: [
              "技术栈全面，前后端都有经验",
              "对前端性能优化有深入理解",
              "能够对比不同技术方案的特点",
              "有实际项目经验，能够结合具体场景说明",
              "对状态管理有清晰的认识"
            ],
            weaknesses: [
              "对后端技术了解可能不够深入",
              "缺乏大型项目的架构设计经验",
              "对新技术的学习和应用需要加强"
            ],
            suggestions: [
              "建议深入学习后端技术，提升全栈开发能力",
              "参与更大规模的项目，积累架构设计经验",
              "关注前端新技术趋势，如WebAssembly、PWA等",
              "可以尝试学习一些后端框架，如Express、Koa等"
            ]
          }),
          feedback: "技术基础扎实，全栈开发经验丰富。对前端技术有深入理解，能够结合实际项目经验进行说明。建议在后端技术和大型项目架构方面加强学习。",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          schedule: {
            company: "字节跳动",
            position: "前端开发工程师",
            interviewDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            round: 1
          },
          questions: [
            {
              id: "5",
              questionText: "请介绍一下前端性能优化的方法",
              userAnswer: "前端性能优化主要包括代码分割、懒加载、缓存策略、CDN使用等。我在项目中使用了React.lazy进行代码分割，通过Webpack的SplitChunksPlugin优化打包。还使用了Service Worker实现离线缓存。",
              aiEvaluation: "回答全面，涵盖了主要的性能优化方法。能够结合具体的技术实现，体现了良好的实践经验。建议可以进一步说明性能监控和测量方法。",
              questionType: "technical"
            },
            {
              id: "6",
              questionText: "React、Vue、Angular有什么区别？",
              userAnswer: "React的特点是组件化、虚拟DOM、单向数据流；Vue更易上手，模板语法直观；Angular功能完整但学习曲线陡峭。React生态丰富，Vue学习成本低，Angular适合大型企业应用。",
              aiEvaluation: "对比分析准确，能够从多个维度进行说明。体现了对不同框架的深入理解。建议可以进一步说明各自的适用场景和选择标准。",
              questionType: "technical"
            },
            {
              id: "7",
              questionText: "你是如何处理前端状态管理的？",
              userAnswer: "我使用Redux进行状态管理，通过action、reducer、store来管理应用状态。对于简单状态使用useState，复杂状态使用useReducer或Redux。还使用Redux Toolkit简化开发流程。",
              aiEvaluation: "对状态管理有清晰的认识，能够根据场景选择合适的方案。提到了现代Redux的使用方式，体现了对技术发展的关注。建议可以补充其他状态管理方案的使用经验。",
              questionType: "technical"
            }
          ]
        }
      ]

      const record = mockRecords.find(r => r.id === recordId)
      
      if (!record) {
        return NextResponse.json({ error: "Interview record not found" }, { status: 404 })
      }

      return NextResponse.json(record)
    }

    const record = await prisma.interviewRecord.findFirst({
      where: { 
        id: recordId,
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
      }
    })

    if (!record) {
      return NextResponse.json({ error: "Interview record not found" }, { status: 404 })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error("Get interview record error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 更新面试记录
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const recordId = params.id
    const body = await request.json()
    const { transcript, feedback, questions } = body

    // 如果是demo用户，返回模拟更新后的数据
    if (session.user.email === "demo@example.com") {
      const mockRecords = [
        {
          id: "1",
          scheduleId: "3",
          audioFilePath: null,
          transcript: transcript || "面试官：你好，请先自我介绍一下...",
          aiAnalysis: JSON.stringify({
            strengths: ["技术基础扎实，对Spring有深入理解"],
            weaknesses: ["对微服务架构理解不够深入"],
            suggestions: ["建议深入学习微服务架构相关知识"]
          }),
          feedback: feedback || "整体表现良好，技术基础扎实，对Spring框架有深入理解。",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          schedule: {
            company: "阿里巴巴",
            position: "Java开发工程师",
            interviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            round: 1
          },
          questions: questions || []
        }
      ]

      const record = mockRecords.find(r => r.id === recordId)
      
      if (!record) {
        return NextResponse.json({ error: "Interview record not found" }, { status: 404 })
      }

      // 模拟更新
      const updatedRecord = {
        ...record,
        transcript: transcript || record.transcript,
        feedback: feedback || record.feedback,
        questions: questions || record.questions,
        updatedAt: new Date().toISOString()
      }

      return NextResponse.json(updatedRecord)
    }

    const record = await prisma.interviewRecord.findFirst({
      where: { 
        id: recordId,
        schedule: {
          userId: session.user.id
        }
      }
    })

    if (!record) {
      return NextResponse.json({ error: "Interview record not found" }, { status: 404 })
    }

    // 使用事务来更新记录和问题
    const updatedRecord = await prisma.$transaction(async (tx) => {
      // 更新面试记录
      const updatedInterviewRecord = await tx.interviewRecord.update({
        where: { id: recordId },
        data: {
          transcript,
          feedback
        }
      })

      // 删除现有问题
      await tx.interviewQuestion.deleteMany({
        where: { recordId }
      })

      // 创建新问题
      if (questions && questions.length > 0) {
        await tx.interviewQuestion.createMany({
          data: questions.map((q: {
            questionText: string
            userAnswer?: string
            aiEvaluation?: string
            questionType?: string
            score?: number
          }) => ({
            recordId,
            questionText: q.questionText,
            userAnswer: q.userAnswer,
            aiEvaluation: q.aiEvaluation,
            questionType: q.questionType,
            score: q.score
          }))
        })
      }

      // 返回更新后的记录
      return await tx.interviewRecord.findUnique({
        where: { id: recordId },
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
              questionType: true,
              score: true
            }
          }
        }
      })
    })

    return NextResponse.json(updatedRecord)
  } catch (error) {
    console.error("Update interview record error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 删除面试记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const recordId = params.id

    // 如果是demo用户，返回成功
    if (session.user.email === "demo@example.com") {
      return NextResponse.json({ message: "Interview record deleted successfully" })
    }

    const record = await prisma.interviewRecord.findFirst({
      where: { 
        id: recordId,
        schedule: {
          userId: session.user.id
        }
      }
    })

    if (!record) {
      return NextResponse.json({ error: "Interview record not found" }, { status: 404 })
    }

    await prisma.interviewRecord.delete({
      where: { id: recordId }
    })

    return NextResponse.json({ message: "Interview record deleted successfully" })
  } catch (error) {
    console.error("Delete interview record error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
