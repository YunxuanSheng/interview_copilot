import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkAndRecordAiUsage } from '@/lib/ai-usage'

// 使用通义千问OpenAI兼容模式
const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '未登录',
        message: '请先登录后再使用简历解析功能'
      }, { status: 401 })
    }

    // 检查credits
    const creditsCheck = await checkAndRecordAiUsage(userId, 'resume_parsing')
    if (!creditsCheck.canUse) {
      return NextResponse.json({
        success: false,
        error: 'Credits不足',
        message: creditsCheck.reason || 'Credits不足',
        creditsInfo: creditsCheck.creditsInfo
      }, { status: 402 })
    }

    const contentType = request.headers.get('content-type')
    
    // 处理文件上传
    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return NextResponse.json({
          success: false,
          error: '未找到文件',
          message: '请选择要解析的简历文件'
        }, { status: 400 })
      }

      // 检查文件类型
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({
          success: false,
          error: '不支持的文件类型',
          message: '请上传PDF、Word或TXT格式的文件'
        }, { status: 400 })
      }

      // 读取文件内容
      const fileBuffer = await file.arrayBuffer()
      const fileContent = Buffer.from(fileBuffer).toString('utf-8')
      
      const result = await parseResumeWithAI(fileContent)
      return NextResponse.json(result)
    }
    
    // 处理文本输入
    const { resumeText } = await request.json()
    
    if (!resumeText || !resumeText.trim()) {
      return NextResponse.json({
        success: false,
        error: '简历内容为空',
        message: '请输入简历内容'
      }, { status: 400 })
    }

    const result = await parseResumeWithAI(resumeText)
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('简历解析API错误:', error)
    return NextResponse.json({
      success: false,
      error: '解析失败',
      message: '简历解析失败，请稍后重试'
    }, { status: 500 })
  }
}

async function parseResumeWithAI(resumeText: string) {
  try {
    const prompt = `请解析以下简历内容，提取个人信息、教育经历、工作经历和技能信息。请严格按照以下JSON格式返回结果：

{
  "personalInfo": {
    "name": "姓名",
    "email": "邮箱地址",
    "phone": "电话号码",
    "location": "居住地址",
    "summary": "个人简介"
  },
  "educations": [
    {
      "school": "学校名称",
      "degree": "学位",
      "major": "专业",
      "startDate": "开始日期(YYYY-MM格式)",
      "endDate": "结束日期(YYYY-MM格式)",
      "description": "描述信息"
    }
  ],
  "workExperiences": [
    {
      "company": "公司名称",
      "position": "职位",
      "startDate": "开始日期(YYYY-MM格式)",
      "endDate": "结束日期(YYYY-MM格式)",
      "description": "工作描述",
      "achievements": "主要成就"
    }
  ],
  "skills": [
    {
      "name": "技能名称",
      "level": "熟练程度(expert/advanced/intermediate/beginner)",
      "category": "技能类别(technical/language/soft/other)"
    }
  ]
}

注意：
1. 如果某个字段无法从简历中提取，请使用空字符串
2. 日期格式统一为YYYY-MM
3. 技能熟练程度分为：expert(精通)、advanced(熟练)、intermediate(了解)、beginner(入门)
4. 技能类别分为：technical(技术)、language(语言)、soft(软技能)、other(其他)
5. 只返回JSON格式，不要包含其他文字说明

简历内容：
${resumeText}`

    const completion = await openai.chat.completions.create({
      model: "qwen-turbo",
      messages: [
        {
          role: "system",
          content: "你是一个专业的简历解析助手，能够准确提取简历中的个人信息、教育经历、工作经历和技能信息。请严格按照要求的JSON格式返回结果。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    })

    const aiResponse = completion.choices[0]?.message?.content
    
    if (!aiResponse) {
      throw new Error('AI解析失败')
    }

    // 解析AI返回的JSON
    let parsedData
    try {
      // 提取JSON部分
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('无法找到JSON格式的响应')
      }
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError)
      console.error('AI原始响应:', aiResponse)
      
      // 如果JSON解析失败，返回错误
      return {
        success: false,
        error: '解析结果格式错误',
        message: 'AI返回的解析结果格式不正确，请重试'
      }
    }

    // 验证解析结果的基本结构
    if (!parsedData.personalInfo || !parsedData.educations || !parsedData.workExperiences || !parsedData.skills) {
      return {
        success: false,
        error: '解析结果不完整',
        message: '简历解析结果缺少必要信息，请检查简历内容是否完整'
      }
    }

    return {
      success: true,
      data: parsedData
    }
    
  } catch (error) {
    console.error('AI解析简历失败:', error)
    return {
      success: false,
      error: 'AI解析失败',
      message: '简历解析失败，请稍后重试'
    }
  }
}


