import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { openai } from "@/lib/openai"

// const CATEGORIES = [
//   "工作职责",
//   "项目经验", 
//   "技术挑战",
//   "团队协作",
//   "业务成果",
//   "学习成长"
// ]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { company, position, description, achievements } = body

    // 验证工作经历是否存在
    const workExperience = await prisma.workExperience.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!workExperience) {
      return NextResponse.json({ error: "Work experience not found" }, { status: 404 })
    }

    // 使用AI生成工作经历卡片
    const prompt = `基于以下工作经历信息，为每个分类生成2-3个具体的面试问题：

公司：${company}
职位：${position}
工作描述：${description}
主要成就：${achievements || "无"}

请为以下6个分类各生成2-3个问题：
1. 工作职责 - 关于具体工作内容和职责的问题
2. 项目经验 - 关于具体项目和成果的问题  
3. 技术挑战 - 关于技术难点和解决方案的问题
4. 团队协作 - 关于团队合作和沟通的问题
5. 业务成果 - 关于业务影响和成果的问题
6. 学习成长 - 关于个人成长和学习的问题

请以JSON格式返回，格式如下：
{
  "cards": [
    {
      "category": "工作职责",
      "question": "具体问题内容",
      "priority": 5
    }
  ]
}`

    if (!openai) {
      throw new Error("OpenAI client not initialized")
    }

    const completion = await openai.chat.completions.create({
      model: "qwen-turbo",
      messages: [
        {
          role: "system",
          content: "你是一个专业的面试官，擅长根据工作经历生成针对性的面试问题。请生成具体、实用的问题，帮助求职者更好地准备面试。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error("AI response is empty")
    }

    // 解析AI响应
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid AI response format")
    }

    const aiResponse = JSON.parse(jsonMatch[0])
    const cards = aiResponse.cards || []

    // 创建卡片
    const createdCards = await prisma.workExperienceCard.createMany({
      data: cards.map((card: any) => ({
        workExperienceId: id,
        category: card.category,
        question: card.question,
        priority: card.priority || 1,
        status: "draft"
      }))
    })

    return NextResponse.json({ 
      success: true, 
      count: createdCards.count 
    })
  } catch (error) {
    console.error("Generate work experience cards error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
