import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { evaluationStandards, generateProfessionalFeedback } from '@/lib/evaluation-standards'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')
    
    // 检查是否是文件上传（multipart/form-data）
    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      return await transcribeAudio(formData)
    }
    
    // 处理JSON请求
    const { action, type, data } = await request.json()

    // 兼容不同的请求格式
    if (action === 'analyze_interview' || type === 'analyze') {
      return await analyzeInterview(data)
    } else if (action === 'transcribe_audio' || type === 'transcribe') {
      return await transcribeAudio(data)
    } else if (action === 'generate_suggestion' || type === 'suggestion') {
      return await generateInterviewSuggestion(data.question, data.currentAnswer)
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action',
        message: '请提供有效的操作类型'
      })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: '服务器内部错误'
    })
  }
}

// 说话人分离处理
async function separateSpeakers(transcript: string): Promise<string> {
  try {
    // 使用AI来智能分离说话人
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `你是一个专业的对话处理助手。请将以下面试对话内容按照"面试官："和"候选人："的格式进行分离。

规则：
1. 识别哪些是面试官的问题（通常包含疑问词、问号，或者是在引导对话）
2. 识别哪些是候选人的回答（通常是回答问题、自我介绍、技术解释等）
3. 如果无法确定说话人，根据上下文和语言特征进行合理推断
4. 保持原始内容的完整性，不要修改或添加内容
5. 输出格式：每行以"面试官："或"候选人："开头，后跟冒号和空格

示例：
输入：宇轩你好,你能不能做个简单的自我介绍? 面试官你好,我叫盛宇轩...
输出：
面试官：宇轩你好,你能不能做个简单的自我介绍?
候选人：面试官你好,我叫盛宇轩...`
        },
        {
          role: "user",
          content: `请处理以下面试对话内容：\n\n${transcript}`
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    })

    return completion.choices[0].message.content || transcript
  } catch (error) {
    console.error('Speaker separation error:', error)
    // 如果AI分离失败，返回原始内容
    return transcript
  }
}

// 语音转文字
async function transcribeAudio(audioData: FormData) {
  try {
    const audioFile = audioData.get('audio') as File
    if (!audioFile) {
      return NextResponse.json({
        success: false,
        error: 'No audio file provided',
        message: '请提供音频文件'
      })
    }

    // 将File转换为OpenAI需要的格式
    const audioBuffer = await audioFile.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type })
    
    const formData = new FormData()
    formData.append('file', audioBlob, audioFile.name)
    formData.append('model', 'whisper-1')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const result = await response.json()
    
    // 对转录结果进行说话人分离处理
    const processedTranscript = await separateSpeakers(result.text)
    
    return NextResponse.json({
      success: true,
      data: {
        transcript: processedTranscript
      },
      message: "语音转文字完成"
    })
  } catch (error) {
    console.error('Transcription error:', error)
    // 如果API调用失败，返回模拟数据
    const mockTranscript = "面试官：你好，请先自我介绍一下。\n候选人：你好，我是张三，有3年前端开发经验，主要使用React和Vue框架开发过多个项目。我毕业于计算机科学专业，在校期间就接触了前端开发，毕业后一直专注于前端技术栈的学习和实践。\n面试官：能说说你对React的理解吗？\n候选人：React是一个用于构建用户界面的JavaScript库，它使用虚拟DOM来提高性能，支持组件化开发。React的核心概念包括组件、状态、属性、生命周期等。我在项目中主要使用函数式组件和Hooks，比如useState、useEffect、useContext等。\n面试官：ES5和ES6有什么区别？\n候选人：ES6相比ES5有很多新特性，比如let和const声明变量，箭头函数，模板字符串，解构赋值，类语法，模块化等。这些新特性让JavaScript更加强大和易用。\n面试官：请实现一个快速排序算法。\n候选人：快速排序是一种分治算法，选择一个基准元素，将数组分为两部分，左边小于基准，右边大于基准，然后递归排序两部分。"
    
    return NextResponse.json({
      success: true,
      data: {
        transcript: mockTranscript
      },
      message: "语音转文字完成(使用模拟数据)"
    })
  }
}

// 分段处理长对话
function splitTranscript(transcript: string, maxChunkSize: number = 10000): string[] {
  const lines = transcript.split('\n')
  const chunks: string[] = []
  let currentChunk = ''
  
  for (const line of lines) {
    // 如果添加这一行会超过限制，先保存当前块
    if (currentChunk.length + line.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = line
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line
    }
  }
  
  // 添加最后一个块
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

// 合并多个分析结果
function mergeAnalysisResults(results: any[]): any {
  const merged: any = {
    strengths: [],
    weaknesses: [],
    suggestions: [],
    questionAnalysis: []
  }
  
  for (const result of results) {
    if (result.strengths) merged.strengths.push(...result.strengths)
    if (result.weaknesses) merged.weaknesses.push(...result.weaknesses)
    if (result.suggestions) merged.suggestions.push(...result.suggestions)
    if (result.questionAnalysis) merged.questionAnalysis.push(...result.questionAnalysis)
  }
  
  // 去重和合并相似内容
  merged.strengths = deduplicateItems(merged.strengths)
  merged.weaknesses = deduplicateItems(merged.weaknesses)
  merged.suggestions = deduplicateItems(merged.suggestions)
  merged.questionAnalysis = deduplicateQuestions(merged.questionAnalysis)
  
  return merged
}

// 去重相似项目
function deduplicateItems(items: any[]): any[] {
  const seen = new Set()
  return items.filter(item => {
    const key = item.description || item.suggestion || item.question
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// 去重相似问题
function deduplicateQuestions(questions: any[]): any[] {
  const seen = new Set()
  return questions.filter(q => {
    const key = q.question?.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// 分析面试内容
async function analyzeInterview(interviewData: { transcript: string }) {
  try {
    const transcriptLength = interviewData.transcript.length
    const isLongConversation = transcriptLength > 15000 // 超过15000字符需要分段处理
    
    if (isLongConversation) {
      // 分段处理长对话
      const chunks = splitTranscript(interviewData.transcript, 10000)
      const analysisResults = []
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        console.log(`处理第 ${i + 1}/${chunks.length} 段对话，长度: ${chunk.length} 字符`)
        
        const result = await analyzeSingleChunk(chunk, i + 1, chunks.length)
        analysisResults.push(result)
        
        // 添加延迟避免API限制
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      return NextResponse.json({
        success: true,
        data: mergeAnalysisResults(analysisResults),
        message: "面试分析完成（分段处理）"
      })
    } else {
      // 短对话直接处理
      const result = await analyzeSingleChunk(interviewData.transcript, 1, 1)
      return NextResponse.json({
        success: true,
        data: result,
        message: "面试分析完成"
      })
    }
  } catch (error) {
    console.error('分析面试内容失败:', error)
    return NextResponse.json({
      success: false,
      error: '分析失败',
      message: '面试分析失败，请稍后重试'
    })
  }
}

// 分析单个对话片段
async function analyzeSingleChunk(transcript: string, chunkIndex: number, totalChunks: number) {
  try {
    const isLongConversation = totalChunks > 1
    const model = isLongConversation ? "gpt-4o" : "gpt-4o-mini"
    const maxTokens = isLongConversation ? 4000 : 2000
    
    const systemPrompt = isLongConversation 
      ? `你是面试分析专家。这是面试对话的第${chunkIndex}部分（共${totalChunks}部分），请分析这部分对话。`
      : `你是面试分析专家。请分析以下面试对话。`
      
    const completion = await openai.chat.completions.create({
    model: model,
    messages: [
      {
        role: "system",
        content: `${systemPrompt}

请严格按照以下JSON格式返回分析结果：

{
  "overallScore": 75,
  "strengths": [
    {
      "category": "技术能力",
      "description": "具体的技术优势描述",
      "evidence": "支撑该优势的具体表现"
    }
  ],
  "weaknesses": [
    {
      "category": "技术深度",
      "description": "具体的技术不足描述",
      "impact": "对面试结果的影响程度",
      "improvement": "具体的改进建议"
    }
  ],
  "suggestions": [
    {
      "priority": "high",
      "category": "技术",
      "suggestion": "具体的改进建议",
      "actionable": "可执行的具体步骤"
    }
  ],
  "comprehensiveFeedback": {
    "technicalAssessment": "对候选人技术能力的综合评估",
    "communicationSkills": "对候选人沟通表达能力的评价",
    "learningPotential": "对候选人学习能力和成长潜力的评估",
    "experienceEvaluation": "对候选人项目经验和实践能力的评价",
    "overallImpression": "对候选人整体表现的印象和评价",
    "keyHighlights": "面试中的关键亮点和突出表现",
    "mainConcerns": "主要关注点和需要改进的地方",
    "recommendation": "是否推荐该候选人的建议和理由"
  },
  "questionAnalysis": [
    {
      "question": "问题内容",
      "answer": "候选人的回答内容",
      "questionType": "algorithm",
      "difficulty": "medium",
      "evaluation": {
        "technicalAccuracy": "技术准确性评价",
        "completeness": "回答完整性评价",
        "clarity": "表达清晰度评价",
        "depth": "技术深度评价",
        "specificFeedback": "具体的优缺点分析",
        "missingPoints": "遗漏的关键点",
        "strengths": "回答中的亮点",
        "improvements": "具体的改进建议"
      },
      "recommendedAnswer": {
        "structure": "推荐回答的结构框架",
        "keyPoints": ["关键点1", "关键点2"],
        "technicalDetails": "技术细节说明",
        "examples": "具体示例",
        "bestPractices": "最佳实践建议",
        "codeImplementation": "如果是算法题，提供完整的代码实现",
        "correctAnswer": "如果是概念题，提供标准正确答案",
        "explanation": "详细的解题思路和知识点解释"
      }
    }
  ]
}

分析要求：
1. 仔细分析整个面试对话，识别出所有的问题和回答
2. questionAnalysis数组应该包含面试中出现的每一个问题
3. 问题类型：algorithm(算法题)、system_design(系统设计)、behavioral(行为面试)、technical(技术问题)
4. 难度：easy(简单)、medium(中等)、hard(困难)
5. 提供具体、可操作的建议，避免简单的对错判断
6. 重点关注候选人的整体表现和潜力`
        },
        {
          role: "user",
          content: `请分析以下面试对话内容。内容已经按照"面试官："和"候选人："的格式进行了分离：

面试内容：
${transcript}

请仔细识别：
1. 所有以"面试官："开头的内容，这些是问题
2. 所有以"候选人："开头的内容，这些是回答
3. 每个问题都要有对应的候选人回答内容
4. 即使回答很简短（如"好的"、"没有了"），也要记录下来

请确保提取到所有的问题和对应的回答。`
        }
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
      response_format: { type: "json_object" }
    })

    // 使用JSON mode后，OpenAI直接返回纯JSON，无需处理markdown
    const content = completion.choices[0].message.content || '{}'
    
    console.log('=== OpenAI返回的JSON内容 ===')
    console.log('内容长度:', content.length)
    console.log('内容预览:', content.substring(0, 300) + '...')
    
    let result
    try {
      result = JSON.parse(content)
      console.log('=== JSON解析成功 ===')
      console.log('解析后的结果:', JSON.stringify(result, null, 2))
    } catch (parseError) {
      console.error('=== JSON解析失败 ===')
      console.error('解析错误:', parseError)
      console.error('无法解析的内容:', content)
      
      // 返回空结果
      return {
        overallScore: 0,
        strengths: [],
        weaknesses: [],
        suggestions: [],
        comprehensiveFeedback: {
          technicalAssessment: "",
          communicationSkills: "",
          learningPotential: "",
          experienceEvaluation: "",
          overallImpression: "",
          keyHighlights: "",
          mainConcerns: "",
          recommendation: ""
        },
        questionAnalysis: []
      }
    }
    
    // 使用专业评价标准处理结果
    if (result.questionAnalysis && Array.isArray(result.questionAnalysis)) {
      result.questionAnalysis = result.questionAnalysis.map((qa: any) => {
        const questionType = qa.questionType || 'technical'
        const criteria = evaluationStandards[questionType] || evaluationStandards.technical
        
        if (qa.evaluation) {
          qa.professionalFeedback = generateProfessionalFeedback(
            questionType,
            qa.evaluation,
            criteria
          )
        }
        
        return qa
      })
    }
    
    return result
  } catch (error) {
    console.error("OpenAI API error:", error)
    // 如果API调用失败，返回空结果
    return {
      strengths: [],
      weaknesses: [],
      suggestions: [],
      questionAnalysis: []
    }
  }
}

// 生成面试建议
async function generateInterviewSuggestion(question: string, currentAnswer?: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `你是一个资深的面试官，请为以下面试问题提供具体的准备建议。`
        },
        {
          role: "user",
          content: `面试问题：${question}
          
          ${currentAnswer ? `当前回答：${currentAnswer}` : ''}
          
          请为这个问题提供具体的准备建议。`
        }
      ],
      temperature: 0.2,
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
    return NextResponse.json({
      success: false,
      error: "生成建议失败",
      message: "请稍后重试"
    })
  }
}