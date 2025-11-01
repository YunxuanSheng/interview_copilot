import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// 使用通义千问OpenAI兼容模式
const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
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

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'DASHSCOPE_API_KEY 环境变量未设置',
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
      model: "qwen-turbo",
      messages: [
        {
          role: "system",
          content: `你是一个专业的隐私保护助手。请分析给定的面试问题列表，识别并处理其中的敏感信息。

重要：只处理真正的敏感信息，不要误判技术术语、常见词汇或面试问题本身的内容。

需要处理的敏感信息类型：
1. 中文人名（必须是真实的人名，如：张三、李四、王小明等。不要误判技术词汇如"面试问题"、"开发"等）
2. 手机号码（11位数字，如：13812345678）
3. 邮箱地址（如：example@email.com）
4. 身份证号（18位）
5. 银行卡号（16-19位）
6. 具体详细地址（如：XX省XX市XX区XX街道XX号）
7. 具体薪资数字（如：月薪50000元）
8. 公司内部保密信息

不需要处理的内容（这些是正常的面试内容，应该保留）：
- 技术术语和概念（如：react hooks、ES5、ES6、javascript等）
- 常见面试问题文本（如："面试问题"、"如何"、"用javascript"等）
- 编程语言、框架名称
- 算法和数据结构名称

对于检测到的敏感信息，请按以下规则进行脱敏：
- 中文人名：完全用星号替换（如：张三 -> **，李小明 -> ***）
- 手机号：保留前3位，其余用*替代（如：13812345678 -> 138****）
- 邮箱：用***@***.***替代
- 其他敏感信息：用***替代

请保持问题的原始结构和含义，只对真正的敏感信息进行脱敏处理，技术词汇和常见面试问题内容必须完整保留。返回JSON格式，包含处理后的每个问题。`
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
        processedQuestions: questions.map((q, _index) => ({
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
        const processedQuestions = processedData.map((processedQ: any, _index: number) => {
          const originalQ = questions[_index]
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
        const processedQuestions = processedData.questions.map((processedQ: any, _index: number) => {
          const originalQ = questions[_index]
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
      const processedQuestions = questions.map((q, _index) => {
        // 查找对应的问题行
        const questionLine = lines.find(line => 
          line.includes(`${_index + 1}.`) || 
          line.includes(`${_index + 1}、`) ||
          line.includes(`${_index + 1}）`)
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
      
      // 解析失败时，使用同步版本的隐私处理（仅处理明确的敏感信息，不处理姓名）
      // 导入同步处理函数
      const { maskSensitiveInfo } = await import('@/lib/privacy-utils')
      const processedQuestions = questions.map((q, _index) => {
        const originalText = typeof q === 'string' ? q : q.text || q.question || ''
        // 使用同步版本，只处理明确的敏感信息（手机号、邮箱等），不处理姓名
        const maskedText = maskSensitiveInfo(originalText)
        
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
