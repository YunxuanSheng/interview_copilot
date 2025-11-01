import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { openai } from "@/lib/openai"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, cardId } = await params

    // 获取卡片信息
    const card = await prisma.workExperienceCard.findFirst({
      where: {
        id: cardId,
        workExperience: {
          id: id,
          userId: session.user.id
        }
      },
      include: {
        workExperience: true
      }
    })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    // 使用AI生成建议
    const prompt = `基于以下工作经历信息，为这个面试问题提供具体的回答建议：

公司：${card.workExperience.company}
职位：${card.workExperience.position}
工作描述：${card.workExperience.description}
主要成就：${card.workExperience.achievements || "无"}

问题分类：${card.category}
具体问题：${card.question}

请提供：
1. 回答要点（3-5个关键点）
2. 具体示例（基于工作经历）
3. 回答技巧（如何更好地表达）

请以结构化的方式返回建议。`

    if (!openai) {
      throw new Error("OpenAI client not initialized")
    }

    const completion = await openai.chat.completions.create({
      model: "qwen-turbo",
      messages: [
        {
          role: "system",
          content: "你是一个专业的面试指导专家，擅长帮助求职者准备面试回答。请提供具体、实用的建议，帮助求职者更好地回答面试问题。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    })

    const suggestion = completion.choices[0]?.message?.content
    if (!suggestion) {
      throw new Error("AI response is empty")
    }

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error("Get work experience card suggestion error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
