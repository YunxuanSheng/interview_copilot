import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    
    if (!text) {
      return NextResponse.json({
        success: false,
        error: '缺少文本参数'
      }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API密钥未设置',
        names: []
      })
    }

    // 使用AI检测姓名
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "你是一个专业的文本分析助手。请分析给定的文本，识别出其中的中文人名。只返回JSON格式的数组，包含所有识别到的中文人名。如果没有识别到中文人名，返回空数组[]。"
        },
        {
          role: "user",
          content: `请分析以下文本中的人名：${text}`
        }
      ],
      temperature: 0.1,
      max_tokens: 100
    })

    const result = response.choices[0]?.message?.content?.trim()
    console.log('AI原始响应:', result)
    
    if (!result) {
      console.log('AI响应为空')
      return NextResponse.json({
        success: true,
        names: []
      })
    }

    try {
      const names = JSON.parse(result)
      console.log('解析后的姓名列表:', names)
      return NextResponse.json({
        success: true,
        names: Array.isArray(names) ? names : []
      })
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError)
      console.log('原始响应内容:', result)
      return NextResponse.json({
        success: true,
        names: []
      })
    }

  } catch (error) {
    console.error('AI姓名检测失败:', error)
    return NextResponse.json({
      success: false,
      error: 'AI姓名检测失败: ' + (error instanceof Error ? error.message : String(error)),
      names: []
    }, { status: 500 })
  }
}
