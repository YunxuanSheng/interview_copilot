import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { questions } = await request.json()
    
    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({
        success: false,
        error: '缺少问题列表参数'
      }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API密钥未设置',
        processedQuestions: []
      })
    }

    // 将所有问题合并成一个文本，发送给AI进行批量处理
    const allQuestionsText = questions.map((q, index) => {
      const questionText = typeof q === 'string' ? q : q.text || q.question || ''
      return `${index + 1}. ${questionText}`
    }).join('\n')

    console.log('批量处理的问题文本:', allQuestionsText)
    console.log('问题数量:', questions.length)

    // 使用AI进行批量隐私处理
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `你是一个专业的隐私保护助手。请分析给定的面试问题列表，识别并处理其中的敏感信息，包括但不限于：

1. 中文人名（如：张三、李四等）
2. 手机号码
3. 邮箱地址
4. 身份证号
5. 银行卡号
6. 具体地址信息
7. 薪资信息
8. 公司内部信息
9. 具体时间信息

对于检测到的敏感信息，请按以下规则进行脱敏：
- 中文人名：完全用星号替换（如：张三 -> **，李小明 -> ***，盛宇轩 -> ***）
- 手机号：保留前3位，其余用*替代（如：13812345678 -> 138****）
- 邮箱：用***@***.***替代
- 其他敏感信息：用***替代

请保持问题的原始结构和含义，只对敏感信息进行脱敏处理。返回JSON格式，包含处理后的每个问题。`
        },
        {
          role: "user",
          content: `请对以下面试问题列表进行隐私处理：\n\n${allQuestionsText}`
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    })

    const result = response.choices[0]?.message?.content?.trim()
    console.log('AI原始响应:', result)
    
    if (!result) {
      console.log('AI响应为空，返回原始问题')
      return NextResponse.json({
        success: true,
        processedQuestions: questions.map((q, index) => ({
          ...q,
          text: typeof q === 'string' ? q : q.text || q.question || ''
        }))
      })
    }

    try {
      // 尝试解析AI返回的JSON
      const processedData = JSON.parse(result)
      
      // 如果AI返回的是数组格式
      if (Array.isArray(processedData)) {
        const processedQuestions = processedData.map((processedQ, index) => {
          const originalQ = questions[index]
          return {
            ...originalQ,
            text: typeof processedQ === 'string' ? processedQ : processedQ.text || processedQ.question || ''
          }
        })
        
        return NextResponse.json({
          success: true,
          processedQuestions
        })
      }
      
      // 如果AI返回的是对象格式，包含questions字段
      if (processedData.questions && Array.isArray(processedData.questions)) {
        const processedQuestions = processedData.questions.map((processedQ, index) => {
          const originalQ = questions[index]
          return {
            ...originalQ,
            text: typeof processedQ === 'string' ? processedQ : processedQ.text || processedQ.question || ''
          }
        })
        
        return NextResponse.json({
          success: true,
          processedQuestions
        })
      }
      
      // 如果格式不匹配，尝试从文本中提取处理后的内容
      console.log('AI返回格式不匹配，尝试文本解析')
      const lines = result.split('\n').filter(line => line.trim())
      const processedQuestions = questions.map((q, index) => {
        // 查找对应的问题行
        const questionLine = lines.find(line => 
          line.includes(`${index + 1}.`) || 
          line.includes(`${index + 1}、`) ||
          line.includes(`${index + 1}）`)
        )
        
        if (questionLine) {
          // 提取问题内容（去掉序号）
          const questionText = questionLine.replace(/^\d+[\.、）]\s*/, '').trim()
          return {
            ...q,
            text: questionText
          }
        }
        
        // 如果找不到对应行，返回原始问题
        return {
          ...q,
          text: typeof q === 'string' ? q : q.text || q.question || ''
        }
      })
      
      return NextResponse.json({
        success: true,
        processedQuestions
      })
      
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError)
      console.log('原始响应内容:', result)
      
      // 解析失败时，尝试简单的文本替换
      const processedQuestions = questions.map((q, index) => {
        const originalText = typeof q === 'string' ? q : q.text || q.question || ''
        // 简单的姓名脱敏（作为备用方案）
        const maskedText = originalText.replace(/[\u4e00-\u9fa5]{2,4}/g, (match) => {
          if (match.length === 2) return '**'
          if (match.length === 3) return '***'
          if (match.length === 4) return '****'
          return match
        })
        
        return {
          ...q,
          text: maskedText
        }
      })
      
      return NextResponse.json({
        success: true,
        processedQuestions
      })
    }

  } catch (error) {
    console.error('批量隐私处理失败:', error)
    return NextResponse.json({
      success: false,
      error: '批量隐私处理失败: ' + (error instanceof Error ? error.message : String(error)),
      processedQuestions: []
    }, { status: 500 })
  }
}
