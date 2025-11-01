import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { evaluationStandards, generateProfessionalFeedback } from '@/lib/evaluation-standards'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkAndRecordAiUsage } from '@/lib/ai-usage'
import { writeFile, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

// 使用通义千问OpenAI兼容模式
// 注意：这里需要 DashScope API Key（格式：sk-xxx），不是 AccessKey
const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY
const isDashScope = !!process.env.DASHSCOPE_API_KEY
const baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

// 输出API配置信息（仅服务端，避免客户端暴露）
if (typeof window === 'undefined') {
  if (apiKey) {
    const apiKeyPrefix = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4)
    console.log('🔧 AI API路由配置:')
    console.log('  ✅ 使用服务:', isDashScope ? '通义千问 (DashScope)' : 'OpenAI兼容模式')
    console.log('  📍 Base URL:', baseURL)
    console.log('  🔑 API Key:', apiKeyPrefix, isDashScope ? '(DashScope)' : '(兼容)')
  } else {
    console.warn('⚠️ 未配置 API Key，AI功能将不可用')
    console.warn('  - 请设置 DASHSCOPE_API_KEY 或 OPENAI_API_KEY 环境变量')
  }
  
  // 如果提供了 AccessKey，给出提示
  if (!apiKey && (process.env.ALIBABA_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID)) {
    console.warn('⚠️ 检测到 AccessKey，但 OpenAI 兼容模式需要 DashScope API Key')
    console.warn('   请在百炼控制台获取 API Key: https://bailian.console.aliyun.com/')
  }
}

const openai = apiKey ? new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
}) : null

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    const contentType = request.headers.get('content-type')
    
    // 检查是否是文件上传（multipart/form-data）
    if (contentType && contentType.includes('multipart/form-data')) {
      // 检查credits
      if (userId) {
        const creditsCheck = await checkAndRecordAiUsage(userId, 'audio_transcription')
        if (!creditsCheck.canUse) {
          return NextResponse.json({
            success: false,
            error: 'Credits不足',
            message: creditsCheck.reason || 'Credits不足',
            creditsInfo: creditsCheck.creditsInfo
          }, { status: 402 })
        }
      }

      const formData = await request.formData()
      const result = await transcribeAudio(formData)
      
      return result
    }
    
    // 处理JSON请求
    const { action, type, data } = await request.json()

    // 兼容不同的请求格式
    if (action === 'analyze_interview' || type === 'analyze') {
      // 检查credits
      if (userId) {
        const creditsCheck = await checkAndRecordAiUsage(userId, 'interview_analysis')
        if (!creditsCheck.canUse) {
          return NextResponse.json({
            success: false,
            error: 'Credits不足',
            message: creditsCheck.reason || 'Credits不足',
            creditsInfo: creditsCheck.creditsInfo
          }, { status: 402 })
        }
      }

      const result = await analyzeInterview(data)
      return result
    } else if (action === 'transcribe_audio' || type === 'transcribe') {
      // 检查credits
      if (userId) {
        const creditsCheck = await checkAndRecordAiUsage(userId, 'audio_transcription')
        if (!creditsCheck.canUse) {
          return NextResponse.json({
            success: false,
            error: 'Credits不足',
            message: creditsCheck.reason || 'Credits不足',
            creditsInfo: creditsCheck.creditsInfo
          }, { status: 402 })
        }
      }

      const result = await transcribeAudio(data)
      return result
    } else if (action === 'generate_suggestion' || type === 'suggestion') {
      // 检查credits
      if (userId) {
        const creditsCheck = await checkAndRecordAiUsage(userId, 'suggestion_generation')
        if (!creditsCheck.canUse) {
          return NextResponse.json({
            success: false,
            error: 'Credits不足',
            message: creditsCheck.reason || 'Credits不足',
            creditsInfo: creditsCheck.creditsInfo
          }, { status: 402 })
        }
      }

      const result = await generateInterviewSuggestion(data.question, data.currentAnswer)
      return result
    } else if (action === 'parse_email' || type === 'parse-email') {
      // 检查credits
      if (userId) {
        const creditsCheck = await checkAndRecordAiUsage(userId, 'email_parsing')
        if (!creditsCheck.canUse) {
          return NextResponse.json({
            success: false,
            error: 'Credits不足',
            message: creditsCheck.reason || 'Credits不足',
            creditsInfo: creditsCheck.creditsInfo
          }, { status: 402 })
        }
      }

      // 提取邮件内容
      const emailContent = typeof data === 'string' ? data : (data?.emailContent || data?.content || data?.text || '')
      
      if (!emailContent || !emailContent.trim()) {
        return NextResponse.json({
          success: false,
          error: '邮件内容为空',
          message: '请提供有效的邮件内容',
          data: null
        }, { status: 400 })
      }

      const result = await parseEmail(emailContent)
      return result
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
    if (!openai) {
      console.warn('通义千问客户端未初始化，跳过说话人分离')
      return transcript
    }
    // 使用AI来智能分离说话人
    console.log('🤖 [说话人分离] 使用服务: 通义千问 | 模型: qwen-plus | 端点:', baseURL)
    const completion = await openai.chat.completions.create({
      model: "qwen-plus",
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

// 语音转文字 - 使用通义千问ASR (通过HTTP API)
async function transcribeAudio(audioData: FormData) {
  let tempFilePath: string | null = null
  try {
    const audioFile = audioData.get('audio') as File
    if (!audioFile) {
      return NextResponse.json({
        success: false,
        error: 'No audio file provided',
        message: '请提供音频文件'
      })
    }

    if (!apiKey) {
      throw new Error('DASHSCOPE_API_KEY 环境变量未设置')
    }

    // 将文件保存到临时目录
    const audioBuffer = await audioFile.arrayBuffer()
    const tempDir = tmpdir()
    tempFilePath = join(tempDir, `audio_${Date.now()}_${audioFile.name}`)
    await writeFile(tempFilePath, Buffer.from(audioBuffer))

    // 读取文件内容，准备转换为base64
    const fileContent = await readFile(tempFilePath)
    const base64Audio = fileContent.toString('base64')
    
    // 使用通义千问ASR API进行语音转文字
    // API端点：https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
    const asrApiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
    console.log('🎤 [语音转文字] 使用服务: 通义千问 ASR')
    console.log('  📍 端点:', asrApiUrl)
    console.log('  🤖 模型: qwen3-asr-flash')
    const response = await fetch(asrApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen3-asr-flash',
        input: {
          messages: [
            {
              role: 'system',
              content: [
                { text: '' } // 可以在这里添加上下文增强
              ]
            },
            {
              role: 'user',
              content: [
                {
                  audio: `data:${audioFile.type || 'audio/wav'};base64,${base64Audio}`
                }
              ]
            }
          ]
        },
        parameters: {
          result_format: 'message',
          asr_options: {
            enable_itn: true // 启用逆文本规范化
          }
        }
      })
    })

    // 清理临时文件
    if (tempFilePath) {
      try {
        await unlink(tempFilePath)
      } catch (cleanupError) {
        console.warn('清理临时文件失败:', cleanupError)
      }
      tempFilePath = null
    }

    if (!response.ok) {
      const errorData = await response.text()
      console.error('通义千问ASR API错误:', response.status, errorData)
      throw new Error(`通义千问ASR API错误: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    if (result.status_code !== 200) {
      throw new Error(`通义千问ASR API错误: ${result.message || '未知错误'}`)
    }

    // 提取转录文本
    // 根据DashScope API响应格式，content可能是字符串或数组
    const message = result.output?.choices?.[0]?.message
    let transcript = ''
    
    if (typeof message?.content === 'string') {
      transcript = message.content
    } else if (Array.isArray(message?.content)) {
      // 如果是数组，提取文本内容
      const textContent = message.content.find((item: any) => item.type === 'text' || item.text)
      transcript = textContent?.text || textContent?.content || ''
    } else if (message?.content) {
      // 尝试直接使用content
      transcript = String(message.content)
    }
    
    if (!transcript) {
      console.error('未能提取转录文本，完整响应:', JSON.stringify(result, null, 2))
      throw new Error('未能获取转录结果')
    }

    // 对转录结果进行说话人分离处理
    const processedTranscript = await separateSpeakers(transcript)
    
    return NextResponse.json({
      success: true,
      data: {
        transcript: processedTranscript
      },
      message: "语音转文字完成"
    })
  } catch (error) {
    // 确保清理临时文件
    if (tempFilePath) {
      try {
        await unlink(tempFilePath)
      } catch (cleanupError) {
        console.warn('清理临时文件失败:', cleanupError)
      }
    }

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
    if (!openai) {
      throw new Error('通义千问客户端未初始化，请检查 DASHSCOPE_API_KEY 是否已配置')
    }

    const isLongConversation = totalChunks > 1
    const model = isLongConversation ? "qwen-plus" : "qwen-turbo"
    const maxTokens = isLongConversation ? 4000 : 2000
    
    const systemPrompt = isLongConversation 
      ? `你是面试助手，专门帮助面试者提升面试表现。这是面试对话的第${chunkIndex}部分（共${totalChunks}部分），请以帮助面试者改进的角度分析这部分对话。`
      : `你是面试助手，专门帮助面试者提升面试表现。请以帮助面试者改进的角度分析以下面试对话。`
    
    console.log(`🤖 [面试分析] 使用服务: 通义千问 | 模型: ${model} | 端点: ${baseURL} | 片段: ${chunkIndex}/${totalChunks}`)
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
    "technicalAssessment": "对面试者技术能力的积极评价和提升建议，3-5句完整分析，引用原话",
    "communicationSkills": "对面试者表达沟通能力的积极评价和改进建议，3-5句完整分析，引用原话",
    "learningPotential": "对面试者学习潜力的积极评估和成长方向，3-5句完整分析，引用原话",
    "experienceEvaluation": "对面试者项目经验的积极评价和扩展建议，3-5句完整分析，引用原话",
    "overallImpression": "对面试者整体表现的积极印象和鼓励性评价",
    "keyHighlights": "面试中的关键亮点和值得保持的优势",
    "mainConcerns": "需要重点关注和提升的方面",
    "recommendation": "针对面试表现的改进建议和下一步学习方向"
  },
  "questionAnalysis": [
    {
      "question": "问题内容",
      "answer": "候选人的回答内容",
      "questionType": "algorithm",
      "difficulty": "medium",
      "priority": "high",
      "recommendedAnswer": "直接给出该问题的最佳答案，要详细完备，不要使用结构化模板。代码题必须给出格式化的代码实现，使用换行和缩进，概念题给出详细的解释和知识点，行为题给出详细的回答和例子。"
    }
  ]
}

分析要求：
1. 仔细分析整个面试对话，识别出所有的问题和回答
2. questionAnalysis数组应该包含面试中出现的每一个问题
3. 问题类型：algorithm(算法题)、system_design(系统设计)、behavioral(行为面试)、technical(技术问题)
4. 难度：easy(简单)、medium(中等)、hard(困难)
5. 优先级：high(高优先级，算法题、核心技术问题、系统设计题，一场面试不超过5个)、medium(中优先级)、low(低优先级，自我介绍、行为面试)
6. 重点关注推荐答案的质量，这是最重要的输出
7. 推荐答案要求：
   - 算法题：提供完整、正确、格式化的代码实现，包含时间复杂度和空间复杂度分析
   - 技术题：提供详细的概念解释、原理说明、应用场景和最佳实践
   - 行为题：提供STAR方法的结构化回答，包含具体示例
   - 系统设计题：提供系统架构图描述、关键组件、数据流、扩展性考虑
8. 推荐答案要直接给出最佳答案，不要使用"结构："、"关键要点："等模板化格式
9. 代码必须使用正确的换行和缩进格式，不要压缩在一行内
10. 综合反馈要引用面试者的原话或思路，每个维度3-5句完整分析
11. 始终保持积极、建设性的语调，专注于帮助面试者提升和改进，而不是评判或否定`
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

请确保提取到所有的问题和对应的回答。

特别注意：对于算法题，推荐答案中的代码必须使用正确的换行和缩进格式，例如：
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] < pivot) {
      left.push(arr[i]);
    } else {
      right.push(arr[i]);
    }
  }
  return [...quickSort(left), pivot, ...quickSort(right)];
}`
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
}


// 解析邮件内容
async function parseEmail(emailContent: string) {
  try {
    console.log('[ParseEmail] 开始解析邮件，内容长度:', emailContent.length)
    
    if (!emailContent || !emailContent.trim()) {
      throw new Error('邮件内容为空')
    }

    if (!apiKey) {
      throw new Error('DASHSCOPE_API_KEY 环境变量未设置')
    }

    const prompt = `请从以下邮件内容中提取面试相关信息。请严格按照以下JSON格式返回结果：

{
  "company": "公司名称",
  "position": "职位名称",
  "department": "部门名称（可选）",
  "interviewDate": "面试日期（ISO 8601格式，如：2024-01-15T14:00:00）",
  "interviewLink": "面试链接（如：Zoom、Teams等会议链接，可选）",
  "round": 1,
  "tags": "标签（可选，用逗号分隔）",
  "notes": "备注信息（可选）"
}

注意：
1. 如果某个字段无法从邮件中提取，请使用空字符串或默认值
2. round（轮次）默认为1，如果能从邮件中识别出轮次信息（如"第一轮"、"第二轮"、"终面"等），请提取并转换为数字
3. 日期格式必须是ISO 8601格式，如：2024-01-15T14:00:00
4. 只返回JSON格式，不要包含其他文字说明

邮件内容：
${emailContent.substring(0, 4000)}` // 限制长度避免超出token限制

    if (!openai) {
      throw new Error('通义千问客户端未初始化，请检查 DASHSCOPE_API_KEY 是否已配置')
    }

    console.log('[ParseEmail] 调用通义千问API...')
    console.log('[ParseEmail] API端点:', baseURL)
    console.log('[ParseEmail] 模型: qwen-turbo')
    const completion = await openai.chat.completions.create({
      model: "qwen-turbo",
      messages: [
        {
          role: "system",
          content: "你是一个专业的邮件解析助手，能够从面试邀请邮件中准确提取公司、职位、面试时间等信息。请严格按照要求的JSON格式返回结果。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: "json_object" }
    })

    console.log('[ParseEmail] API调用成功')
    const aiResponse = completion.choices[0]?.message?.content
    
    if (!aiResponse) {
      console.error('[ParseEmail] AI响应为空')
      throw new Error('AI解析失败：响应为空')
    }

    console.log('[ParseEmail] AI原始响应:', aiResponse.substring(0, 200))

    // 解析AI返回的JSON
    let parsedData
    try {
      parsedData = JSON.parse(aiResponse)
    } catch (parseError) {
      console.error('[ParseEmail] JSON解析失败:', parseError)
      console.error('[ParseEmail] AI原始响应:', aiResponse)
      
      // 尝试提取JSON部分
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('无法找到JSON格式的响应')
      }
    }

    // 验证和设置默认值
    if (!parsedData.company) {
      parsedData.company = ""
    }
    if (!parsedData.position) {
      parsedData.position = ""
    }
    if (!parsedData.round || parsedData.round === 0) {
      parsedData.round = 1
    }
    if (!parsedData.interviewDate) {
      parsedData.interviewDate = ""
    }
    if (!parsedData.department) {
      parsedData.department = ""
    }
    if (!parsedData.interviewLink) {
      parsedData.interviewLink = ""
    }
    if (!parsedData.tags) {
      parsedData.tags = ""
    }
    if (!parsedData.notes) {
      parsedData.notes = ""
    }

    console.log('[ParseEmail] 解析成功:', parsedData)
    return NextResponse.json({
      success: true,
      data: parsedData,
      message: "邮件解析成功"
    })
    
  } catch (error) {
    console.error('[ParseEmail] 解析邮件失败:', error)
    console.error('[ParseEmail] 错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json({
      success: false,
      error: 'AI解析失败',
      message: error instanceof Error ? error.message : '邮件解析失败，请稍后重试',
      data: null
    }, { status: 500 })
  }
}

// 生成面试建议
async function generateInterviewSuggestion(question: string, currentAnswer?: string) {
  try {
    if (!openai) {
      throw new Error('通义千问客户端未初始化，请检查 DASHSCOPE_API_KEY 是否已配置')
    }
    console.log('🤖 [面试建议] 使用服务: 通义千问 | 模型: qwen-turbo | 端点:', baseURL)
    const completion = await openai.chat.completions.create({
      model: "qwen-turbo",
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