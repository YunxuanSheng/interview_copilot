import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Session } from "next-auth"

// 模拟AI功能 - 在实际项目中需要集成真实的AI服务
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case "parse-email":
        return await parseEmail(data)
      case "transcribe":
        return await transcribeAudio(data)
      case "analyze":
        return await analyzeInterview(data)
      case "generate-project-cards":
        return await generateProjectCards(data)
      case "get-card-suggestion":
        return await getCardSuggestion(data)
      default:
        return NextResponse.json({ error: "Invalid AI function type" }, { status: 400 })
    }
  } catch (error) {
    console.error("AI API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 解析邮件内容
async function parseEmail(_emailContent: string) {
  // 模拟AI解析邮件
  const mockResult = {
    company: "腾讯",
    position: "前端开发工程师",
    department: "技术部",
    interviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    interviewLink: "https://meeting.example.com/room/123",
    round: 1,
    tags: "技术面试,前端",
    notes: "AI解析的面试安排信息"
  }

  return NextResponse.json({
    success: true,
    data: mockResult,
    message: "邮件解析成功"
  })
}

// 语音转文字
async function transcribeAudio(_audioData: unknown) {
  // 模拟语音转文字
  const mockTranscript = `
    面试官：你好，请先自我介绍一下。
    候选人：你好，我是张三，有3年前端开发经验，主要使用React和Vue框架。
    面试官：能说说你对React的理解吗？
    候选人：React是一个用于构建用户界面的JavaScript库，它使用虚拟DOM来提高性能...
  `

  return NextResponse.json({
    success: true,
    data: {
      transcript: mockTranscript.trim(),
      duration: 1800, // 30分钟
      confidence: 0.95
    },
    message: "语音转文字完成"
  })
}

// 分析面试内容
async function analyzeInterview(_interviewData: { transcript: string }) {
  // 模拟AI分析
  const mockAnalysis = {
    strengths: [
      "技术基础扎实，对React有深入理解",
      "回答逻辑清晰，表达能力强",
      "有实际项目经验"
    ],
    weaknesses: [
      "对系统设计理解不够深入",
      "缺乏大型项目经验",
      "对性能优化方案不够全面"
    ],
    suggestions: [
      "建议深入学习系统设计相关知识",
      "可以尝试参与更大规模的项目",
      "多关注性能优化和最佳实践"
    ],
    questionAnalysis: [
      {
        question: "请介绍一下React的虚拟DOM",
        answer: "React使用虚拟DOM来提高性能...",
        evaluation: "回答准确，理解深入"
      },
      {
        question: "如何优化React应用性能？",
        answer: "可以使用React.memo、useMemo等...",
        evaluation: "回答基本正确，但不够全面"
      }
    ]
  }

  return NextResponse.json({
    success: true,
    data: mockAnalysis,
    message: "面试分析完成"
  })
}

// 生成项目卡片
async function generateProjectCards(data: {
  projectName: string
  role: string
  description: string
  techStack?: string
  timeRange?: string
}) {
  const { projectName, role, description, techStack, timeRange } = data

  // 模拟AI生成项目卡片
  const categories = [
    "项目背景",
    "职责拆解", 
    "难点挑战",
    "技术实现",
    "协作沟通",
    "反思与优化"
  ]

  const mockCards = categories.map((category, index) => {
    const questions = {
      "项目背景": [
        `请介绍一下${projectName}这个项目的背景和业务价值？`,
        `这个项目解决了什么核心问题？`,
        `项目的目标用户群体是什么？`
      ],
      "职责拆解": [
        `你在${projectName}项目中具体负责哪些模块？`,
        `你的工作职责在整个项目中的占比如何？`,
        `与其他团队成员是如何分工协作的？`
      ],
      "难点挑战": [
        `在${projectName}项目中遇到的最大技术挑战是什么？`,
        `项目开发过程中遇到哪些业务难点？`,
        `如何解决项目中的性能瓶颈问题？`
      ],
      "技术实现": [
        `${projectName}项目的技术架构是怎样的？`,
        `为什么选择${techStack || "这些技术栈"}？`,
        `项目中用到了哪些核心算法或设计模式？`
      ],
      "协作沟通": [
        `在${projectName}项目中如何与产品经理协作？`,
        `如何与后端/前端/测试团队配合？`,
        `项目中的需求变更是如何处理的？`
      ],
      "反思与优化": [
        `如果重新做${projectName}项目，你会如何优化？`,
        `项目中有哪些可以改进的地方？`,
        `从${projectName}项目中你学到了什么？`
      ]
    }

    const suggestions = {
      "项目背景": [
        "查看项目PRD文档了解业务背景",
        "回顾项目启动会议记录",
        "查看产品需求文档和用户调研报告"
      ],
      "职责拆解": [
        "整理个人工作日志和代码提交记录",
        "查看项目分工文档和会议纪要",
        "回顾与团队成员的沟通记录"
      ],
      "难点挑战": [
        "查看技术方案设计文档",
        "回顾问题解决过程的技术笔记",
        "整理性能测试报告和优化记录"
      ],
      "技术实现": [
        "查看项目架构图和设计文档",
        "整理关键技术选型的调研报告",
        "回顾代码实现的核心逻辑"
      ],
      "协作沟通": [
        "查看项目沟通群聊记录",
        "整理跨部门协作的邮件往来",
        "回顾项目评审和复盘会议记录"
      ],
      "反思与优化": [
        "整理项目总结和复盘文档",
        "查看用户反馈和数据分析报告",
        "回顾技术债务和改进计划"
      ]
    }

    const categoryQuestions = questions[category as keyof typeof questions]
    const categorySuggestions = suggestions[category as keyof typeof suggestions]
    
    return {
      category,
      question: categoryQuestions[index % categoryQuestions.length],
      aiSuggestion: categorySuggestions.join("；"),
      priority: Math.floor(Math.random() * 3) + 3 // 3-5的随机优先级
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      cards: mockCards,
      total: mockCards.length
    },
    message: "项目卡片生成成功"
  })
}

// 获取卡片AI建议
async function getCardSuggestion(data: {
  projectName: string
  role: string
  category: string
  question: string
  currentAnswer?: string
}) {
  const { projectName, role, category, question, currentAnswer } = data

  // 模拟AI建议
  const suggestions = {
    "项目背景": [
      "查看项目PRD文档了解业务背景和目标",
      "回顾项目启动会议记录和需求文档",
      "整理项目相关的市场调研和竞品分析报告"
    ],
    "职责拆解": [
      "整理个人工作日志和代码提交记录",
      "查看项目分工文档和团队协作记录",
      "回顾与产品、设计、测试的协作过程"
    ],
    "难点挑战": [
      "查看技术方案设计文档和问题解决记录",
      "整理性能测试报告和优化过程文档",
      "回顾技术选型的调研和决策过程"
    ],
    "技术实现": [
      "查看项目架构图和系统设计文档",
      "整理关键技术选型的调研报告",
      "回顾核心代码实现和算法设计"
    ],
    "协作沟通": [
      "查看项目沟通群聊和邮件记录",
      "整理跨部门协作的会议纪要",
      "回顾项目评审和复盘会议记录"
    ],
    "反思与优化": [
      "整理项目总结和复盘文档",
      "查看用户反馈和数据分析报告",
      "回顾技术债务和改进计划"
    ]
  }

  const categorySuggestions = suggestions[category as keyof typeof suggestions] || suggestions["项目背景"]
  
  let aiSuggestion = categorySuggestions.join("；")
  
  if (currentAnswer) {
    aiSuggestion += `\n\n基于你当前的回答，建议补充：具体的数据指标、具体的解决方案、具体的成果展示。`
  }

  return NextResponse.json({
    success: true,
    data: {
      suggestion: aiSuggestion
    },
    message: "AI建议生成成功"
  })
}
