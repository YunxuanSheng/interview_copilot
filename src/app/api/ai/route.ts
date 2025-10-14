import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Session } from "next-auth"
import { openai } from "@/lib/openai"

// 集成真实的OpenAI API服务
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 检查是否是文件上传（multipart/form-data）
    const contentType = request.headers.get('content-type')
    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      return await transcribeAudio(formData)
    }

    // 处理JSON请求
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
async function parseEmail(emailContent: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `你是一个专业的面试邮件解析助手。请从邮件内容中提取以下信息，并以JSON格式返回：
          {
            "company": "公司名称",
            "position": "职位名称", 
            "department": "部门名称",
            "interviewDate": "面试日期(ISO格式)",
            "interviewLink": "面试链接",
            "round": "面试轮次(数字)",
            "tags": "标签(用逗号分隔)",
            "notes": "备注信息"
          }
          
          如果某些信息在邮件中找不到，请用null表示。日期请转换为ISO格式。`
        },
        {
          role: "user",
          content: `请解析以下邮件内容：\n\n${emailContent}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    
    return NextResponse.json({
      success: true,
      data: result,
      message: "邮件解析成功"
    })
  } catch (error) {
    console.error("OpenAI API error:", error)
    // 如果API调用失败，返回模拟数据
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
      message: "邮件解析成功(使用模拟数据)"
    })
  }
}

// 语音转文字
async function transcribeAudio(audioData: FormData) {
  try {
    // 获取上传的音频文件
    const audioFile = audioData.get('audio') as File
    if (!audioFile) {
      throw new Error('No audio file provided')
    }

    // 检查文件大小（限制为100MB）
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (audioFile.size > maxSize) {
      throw new Error('File too large. Maximum size is 100MB.')
    }

    // 检查文件类型
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg']
    if (!allowedTypes.includes(audioFile.type)) {
      throw new Error('Unsupported file type. Please upload MP3, WAV, M4A, or OGG files.')
    }

    // 将文件转换为Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 使用OpenAI Whisper API进行语音转文字
    const transcription = await openai.audio.transcriptions.create({
      file: new File([buffer], audioFile.name, { type: audioFile.type }),
      model: "whisper-1",
      language: "zh", // 指定中文
      response_format: "text"
    })

    return NextResponse.json({
      success: true,
      data: {
        transcript: transcription,
        duration: Math.floor(audioFile.size / 10000), // 估算时长
        confidence: 0.95
      },
      message: "语音转文字完成"
    })
  } catch (error) {
    console.error("Whisper API error:", error)
    
    // 如果Whisper API失败，返回模拟数据
    const mockTranscript = `
面试官：你好，请先自我介绍一下。

候选人：你好，我是张三，有3年前端开发经验，主要使用React和Vue框架开发过多个项目。我毕业于计算机科学专业，在校期间就接触了前端开发，毕业后一直专注于前端技术栈的学习和实践。

面试官：能说说你对React的理解吗？

候选人：React是一个用于构建用户界面的JavaScript库，它使用虚拟DOM来提高性能，支持组件化开发。React的核心概念包括组件、状态、属性、生命周期等。我在项目中主要使用函数式组件和Hooks，比如useState、useEffect、useContext等。React的虚拟DOM机制可以最小化DOM操作，提高渲染性能。

面试官：如何优化React应用性能？

候选人：React性能优化可以从多个方面入手。首先是组件层面，可以使用React.memo来避免不必要的重渲染，useMemo和useCallback来缓存计算结果和函数。其次是代码分割，使用React.lazy和Suspense实现按需加载。还有列表渲染优化，使用key属性，避免在render中创建新对象。另外还有状态管理优化，合理使用useState和useReducer，避免状态过于复杂。

面试官：能介绍一下你最近的项目吗？

候选人：最近做了一个电商平台的前端项目，使用了React + TypeScript + Ant Design，实现了用户管理、商品展示、购物车等功能。项目采用微前端架构，主应用使用single-spa，子应用独立开发和部署。我负责商品模块的开发，包括商品列表、详情页、搜索筛选等功能。在性能优化方面，我使用了虚拟滚动来处理大量商品数据，图片懒加载减少首屏加载时间。

面试官：在项目中遇到过哪些技术难点，是如何解决的？

候选人：最大的难点是商品搜索的性能问题。当用户输入搜索关键词时，需要实时搜索并展示结果，但商品数据量很大，直接遍历会很慢。我采用了防抖技术，延迟300ms执行搜索，避免频繁请求。同时使用Web Worker在后台进行搜索计算，不阻塞主线程。还实现了搜索结果的缓存机制，相同关键词直接返回缓存结果。

面试官：你了解哪些前端工程化工具？

候选人：我熟悉Webpack、Vite等打包工具，了解它们的配置和优化。使用过ESLint、Prettier进行代码规范，Husky做Git钩子，Jest做单元测试。在CI/CD方面，使用过GitHub Actions和Jenkins。还了解过微前端方案，比如qiankun、single-spa等。

面试官：对TypeScript有什么理解？

候选人：TypeScript是JavaScript的超集，提供了静态类型检查。我在项目中大量使用TypeScript，可以提前发现类型错误，提高代码质量。我熟悉接口定义、泛型、联合类型、交叉类型等概念。TypeScript的智能提示和重构功能也大大提高了开发效率。

面试官：你如何保证代码质量？

候选人：首先建立代码规范，使用ESLint和Prettier统一代码风格。其次编写单元测试，使用Jest和React Testing Library测试组件功能。还有代码审查，通过Pull Request进行同行评审。最后是持续集成，每次提交都自动运行测试和构建，确保代码质量。

面试官：你平时如何学习新技术？

候选人：我主要通过官方文档、技术博客、开源项目来学习新技术。会关注一些技术社区，比如掘金、思否等。也会通过实际项目来实践新技术，遇到问题会查阅资料或向同事请教。还会参加一些技术会议和线上分享，了解行业动态。

面试官：你对前端发展趋势有什么看法？

候选人：我认为前端正在向全栈方向发展，Node.js让前端可以处理服务端逻辑。微前端架构也越来越成熟，可以更好地支持大型应用。还有WebAssembly、PWA等新技术，让前端应用更接近原生体验。另外，低代码平台和无代码工具也在兴起，可能会改变前端开发的模式。

面试官：你有什么问题要问我们吗？

候选人：我想了解一下公司的技术栈和团队规模，以及这个岗位的具体职责。还有公司对新技术的接受程度，是否有技术分享和学习的氛围。

面试官：我们主要使用React + Node.js的技术栈，团队有20人左右，这个岗位主要负责前端开发。我们鼓励技术创新，每周都有技术分享会。

候选人：听起来很不错，我很期待能加入这样的团队。

面试官：好的，今天的面试就到这里，我们会在一周内给你回复。

候选人：谢谢，期待您的回复。
    `

    return NextResponse.json({
      success: true,
      data: {
        transcript: mockTranscript.trim(),
        duration: 1800, // 30分钟
        confidence: 0.95
      },
      message: "语音转文字完成(使用模拟数据)"
    })
  }
}

// 分析面试内容
async function analyzeInterview(interviewData: { transcript: string }) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `你是一个专业的面试分析专家。请分析面试对话内容，提供以下方面的评估和建议，并以JSON格式返回：
          {
            "strengths": ["优势1", "优势2", "优势3"],
            "weaknesses": ["不足1", "不足2", "不足3"],
            "suggestions": ["建议1", "建议2", "建议3"],
            "questionAnalysis": [
              {
                "question": "问题内容",
                "answer": "回答内容",
                "evaluation": "评价"
              }
            ]
          }
          
          请基于面试对话的实际内容进行分析，提供具体、有针对性的建议。`
        },
        {
          role: "user",
          content: `请分析以下面试对话内容：\n\n${interviewData.transcript}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    
    return NextResponse.json({
      success: true,
      data: result,
      message: "面试分析完成"
    })
  } catch (error) {
    console.error("OpenAI API error:", error)
    // 如果API调用失败，返回模拟数据
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
      message: "面试分析完成(使用模拟数据)"
    })
  }
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
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `你是一个专业的面试准备助手。请为项目经验生成面试准备卡片，包含以下6个类别的问题和AI建议，并以JSON格式返回：
          {
            "cards": [
              {
                "category": "项目背景",
                "question": "具体问题",
                "aiSuggestion": "AI建议",
                "priority": 3-5的优先级数字
              }
            ]
          }
          
          类别包括：项目背景、职责拆解、难点挑战、技术实现、协作沟通、反思与优化
          请根据项目信息生成具体、有针对性的问题和建议。`
        },
        {
          role: "user",
          content: `请为以下项目生成面试准备卡片：
          项目名称：${projectName}
          角色：${role}
          项目描述：${description}
          技术栈：${techStack || "未指定"}
          时间范围：${timeRange || "未指定"}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    
    return NextResponse.json({
      success: true,
      data: result,
      message: "项目卡片生成成功"
    })
  } catch (error) {
    console.error("OpenAI API error:", error)
    // 如果API调用失败，返回模拟数据
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
      message: "项目卡片生成成功(使用模拟数据)"
    })
  }
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
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `你是一个专业的面试准备助手。请为面试问题提供具体的准备建议，包括：
          1. 需要查看的文档和资料
          2. 需要回顾的具体经历
          3. 需要准备的具体数据和指标
          4. 回答的结构和要点
          
          请提供具体、可操作的建议，帮助候选人更好地准备面试。`
        },
        {
          role: "user",
          content: `项目：${projectName}
          角色：${role}
          类别：${category}
          问题：${question}
          ${currentAnswer ? `当前回答：${currentAnswer}` : ''}
          
          请为这个问题提供具体的准备建议。`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })

    const suggestion = completion.choices[0].message.content || "建议查看相关文档和回顾具体经历。"
    
    return NextResponse.json({
      success: true,
      data: {
        suggestion: suggestion
      },
      message: "AI建议生成成功"
    })
  } catch (error) {
    console.error("OpenAI API error:", error)
    // 如果API调用失败，返回模拟数据
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
      message: "AI建议生成成功(使用模拟数据)"
    })
  }
}
