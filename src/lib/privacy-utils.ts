/**
 * 隐私保护工具函数
 */

// 不再直接导入openai，通过API接口调用

// 常见姓氏列表（用于更精确的姓名识别）
const COMMON_SURNAMES = [
  '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
  '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕',
  '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎', '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜',
  '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆', '郝', '孔', '白', '崔', '康', '毛', '邱', '秦', '江', '史',
  '顾', '侯', '邵', '孟', '龙', '万', '段', '漕', '钱', '汤', '尹', '黎', '易', '常', '武', '乔', '贺', '赖', '龚', '文'
]

// 敏感信息脱敏规则
const SENSITIVE_PATTERNS = [
  // 手机号模式
  { pattern: /1[3-9]\d{9}/g, replacement: '1****' },
  // 邮箱模式
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '***@***.***' },
  // 身份证号模式
  { pattern: /\d{17}[\dXx]/g, replacement: '******************' },
  // 银行卡号模式
  { pattern: /\d{16,19}/g, replacement: '****************' },
  // 公司内部信息
  { pattern: /(公司|部门|团队|组|组别)[\u4e00-\u9fa5]{2,10}/g, replacement: '***' },
  // 具体地址
  { pattern: /[\u4e00-\u9fa5]{2,}(省|市|区|县|街道|路|号)/g, replacement: '***' },
  // 具体时间（保留年份和月份，隐藏具体日期）
  { pattern: /(\d{4})年(\d{1,2})月(\d{1,2})日/g, replacement: '$1年$2月**日' },
  // 具体时间（保留年份，隐藏月份和日期）
  { pattern: /(\d{4})年(\d{1,2})月/g, replacement: '$1年**月' },
]

/**
 * 检测是否为可能的姓名
 * @param text 要检测的文本
 * @returns 是否为可能的姓名
 */
function isPossibleName(text: string): boolean {
  // 长度检查：2-4个字符
  if (text.length < 2 || text.length > 4) return false
  
  // 必须全部是中文字符
  if (!/^[\u4e00-\u9fa5]+$/.test(text)) return false
  
  // 检查是否以常见姓氏开头
  const firstChar = text[0]
  if (!COMMON_SURNAMES.includes(firstChar)) return false
  
  // 排除一些明显不是姓名的词汇（包括技术术语、常见面试问题等）
  const excludeWords = [
    '公司', '部门', '团队', '项目', '产品', '技术', '开发', '设计', '运营', '市场',
    '销售', '财务', '人事', '行政', '管理', '服务', '系统', '平台', '应用', '软件',
    '硬件', '网络', '数据', '算法', '模型', '框架', '工具', '方法', '策略', '方案',
    '计划', '目标', '任务', '工作', '业务', '流程', '标准', '规范', '规则', '制度',
    '面试', '问题', '答案', '回答', '解析', '解释', '说明', '介绍', '描述', '实现',
    '优化', '改进', '提升', '提高', '完善', '增强', '扩展', '修改', '更新', '维护'
  ]
  
  if (excludeWords.includes(text)) return false
  
  return true
}

/**
 * 使用AI检测文本中的姓名（通过API接口）
 * @param text 要检测的文本
 * @returns 检测到的姓名列表
 */
async function detectNamesWithAI(text: string): Promise<string[]> {
  try {
    const response = await fetch('/api/ai/detect-names', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    })

    if (!response.ok) {
      console.warn('⚠️ AI姓名检测API调用失败')
      return []
    }

    const result = await response.json()
    
    if (!result.success) {
      console.warn('⚠️ AI姓名检测失败:', result.error)
      return []
    }

    return Array.isArray(result.names) ? result.names : []
  } catch (error) {
    console.warn('⚠️ AI姓名检测失败:', error instanceof Error ? error.message : String(error))
    return []
  }
}

/**
 * 对姓名进行脱敏处理（同步版本，使用正则表达式）
 * @param text 原始文本
 * @returns 脱敏后的文本
 */
function _maskNamesSync(text: string): string {
  const namesToMask: string[] = []
  
  // 使用规则检测姓名
  const namePattern = /[\u4e00-\u9fa5]{2,4}/g
  let match
  while ((match = namePattern.exec(text)) !== null) {
    if (isPossibleName(match[0])) {
      namesToMask.push(match[0])
    }
  }
  
  // 对检测到的姓名进行脱敏
  let maskedText = text
  namesToMask.forEach(name => {
    const replacement = name.length === 2 
      ? '**'
      : name.length === 3 
      ? '***'
      : '****'
    
    maskedText = maskedText.replace(new RegExp(name, 'g'), replacement)
  })
  
  return maskedText
}

/**
 * 对姓名进行脱敏处理（异步版本，优先使用AI）
 * @param text 原始文本
 * @param useAI 是否使用AI辅助检测，默认为true
 * @returns 脱敏后的文本
 */
async function maskNames(text: string, useAI: boolean = true): Promise<string> {
  let namesToMask: string[] = []
  
  if (useAI) {
    try {
      // 使用AI检测姓名
      namesToMask = await detectNamesWithAI(text)
    } catch (error) {
      console.warn('AI姓名检测失败，回退到正则表达式方法:', error)
      // AI检测失败时回退到正则表达式方法
      const namePattern = /[\u4e00-\u9fa5]{2,4}/g
      let match
      while ((match = namePattern.exec(text)) !== null) {
        if (isPossibleName(match[0])) {
          namesToMask.push(match[0])
        }
      }
    }
  } else {
    // 使用规则检测姓名
    const namePattern = /[\u4e00-\u9fa5]{2,4}/g
    let match
    while ((match = namePattern.exec(text)) !== null) {
      if (isPossibleName(match[0])) {
        namesToMask.push(match[0])
      }
    }
  }
  
  // 对检测到的姓名进行脱敏
  let maskedText = text
  namesToMask.forEach(name => {
    const replacement = name.length === 2 
      ? '**'
      : name.length === 3 
      ? '***'
      : '****'
    
    maskedText = maskedText.replace(new RegExp(name, 'g'), replacement)
  })
  
  return maskedText
}

/**
 * 对文本进行脱敏处理（同步版本，仅处理非姓名敏感信息）
 * @param text 原始文本
 * @returns 脱敏后的文本
 */
export function maskSensitiveInfo(text: string): string {
  if (!text) return text
  
  let maskedText = text
  
  // 注意：同步版本不处理姓名脱敏，因为需要AI检测
  // 只处理其他敏感信息
  SENSITIVE_PATTERNS.forEach(({ pattern, replacement }) => {
    maskedText = maskedText.replace(pattern, replacement)
  })
  
  return maskedText
}

/**
 * 对文本进行脱敏处理（异步版本，必须使用AI检测姓名）
 * @param text 原始文本
 * @returns 脱敏后的文本
 */
export async function maskSensitiveInfoAsync(text: string): Promise<string> {
  if (!text) return text
  
  let maskedText = text
  
  // 处理姓名脱敏（通过API接口）
  maskedText = await maskNames(maskedText, true)
  
  // 应用其他脱敏规则
  SENSITIVE_PATTERNS.forEach(({ pattern, replacement }) => {
    maskedText = maskedText.replace(pattern, replacement)
  })
  
  return maskedText
}

/**
 * 检测文本中是否包含敏感信息
 * @param text 要检测的文本
 * @returns 是否包含敏感信息
 */
export function hasSensitiveInfo(text: string): boolean {
  if (!text) return false
  
  // 检查姓名
  const namePattern = /[\u4e00-\u9fa5]{2,4}/g
  let hasName = false
  let match
  while ((match = namePattern.exec(text)) !== null) {
    if (isPossibleName(match[0])) {
      hasName = true
      break
    }
  }
  
  // 检查其他敏感信息
  const hasOtherSensitiveInfo = SENSITIVE_PATTERNS.some(({ pattern }) => pattern.test(text))
  
  return hasName || hasOtherSensitiveInfo
}

/**
 * 对面试问题和答案进行脱敏处理（同步版本，仅处理非姓名敏感信息）
 * @param questions 问题列表
 * @param answers 答案列表
 * @param enableAnswerSharing 是否分享答案
 * @param enablePersonalInfo 是否分享个人信息
 * @returns 脱敏后的问题和答案
 */
export function maskInterviewContent(
  questions: any[],
  answers: any[] = [],
  _enableAnswerSharing: boolean = false,
  _enablePersonalInfo: boolean = false
) {
  console.warn('⚠️ 使用同步版本脱敏，无法处理姓名信息。建议使用maskInterviewContentAsync进行完整脱敏。')
  
  const maskedQuestions = questions.map((question, _index) => {
    const questionText = typeof question === 'string' ? question : question.text || question.question || ''
    
    // 只处理非姓名敏感信息
    const maskedQuestionText = maskSensitiveInfo(questionText)
    
    return {
      ...question,
      text: maskedQuestionText,
      originalText: questionText
    }
  })
  
  const maskedAnswers = _enableAnswerSharing 
    ? answers.map((answer, _index) => {
        const answerText = typeof answer === 'string' ? answer : answer.text || ''
        const maskedAnswerText = maskSensitiveInfo(answerText)
        
        return {
          ...answer,
          text: maskedAnswerText,
          originalText: answerText
        }
      })
    : []
  
  return {
    questions: maskedQuestions,
    answers: maskedAnswers
  }
}

/**
 * 对面试问题和答案进行脱敏处理（异步版本，必须使用AI）
 * @param questions 问题列表
 * @param answers 答案列表
 * @param enableAnswerSharing 是否分享答案
 * @param enablePersonalInfo 是否分享个人信息
 * @returns 脱敏后的问题和答案
 */
export async function maskInterviewContentAsync(
  questions: any[],
  answers: any[] = [],
  enableAnswerSharing: boolean = false,
  _enablePersonalInfo: boolean = false
) {
  const maskedQuestions = await Promise.all(questions.map(async (question, _index) => {
    const questionText = typeof question === 'string' ? question : question.text || question.question || ''
    
    // 使用AI进行完整脱敏
    const maskedQuestionText = await maskSensitiveInfoAsync(questionText)
    
    return {
      ...question,
      text: maskedQuestionText,
      originalText: questionText
    }
  }))
  
  const maskedAnswers = enableAnswerSharing 
    ? await Promise.all(answers.map(async (answer, _index) => {
        const answerText = typeof answer === 'string' ? answer : answer.text || ''
        const maskedAnswerText = await maskSensitiveInfoAsync(answerText)
        
        return {
          ...answer,
          text: maskedAnswerText,
          originalText: answerText
        }
      }))
    : []
  
  return {
    questions: maskedQuestions,
    answers: maskedAnswers
  }
}

/**
 * 批量处理问题列表的隐私信息（使用AI）
 * @param questions 问题列表
 * @returns 处理后的问题列表
 */
export async function batchProcessQuestionsWithAI(questions: any[]): Promise<any[]> {
  try {
    const response = await fetch('/api/ai/batch-privacy-process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ questions })
    })

    if (!response.ok) {
      console.warn('⚠️ 批量隐私处理API调用失败')
      // 回退到逐个处理
      return await Promise.all(questions.map(async q => {
        const text = typeof q === 'string' ? q : q.text || q.question || ''
        const maskedText = await maskSensitiveInfoAsync(text)
        return {
          ...q,
          text: maskedText
        }
      }))
    }

    const result = await response.json()
    
    if (!result.success) {
      console.warn('⚠️ 批量隐私处理失败:', result.error)
      // 回退到逐个处理
      return await Promise.all(questions.map(async q => {
        const text = typeof q === 'string' ? q : q.text || q.question || ''
        const maskedText = await maskSensitiveInfoAsync(text)
        return {
          ...q,
          text: maskedText
        }
      }))
    }

    return result.processedQuestions || questions
  } catch (error) {
    console.warn('⚠️ 批量隐私处理失败:', error instanceof Error ? error.message : String(error))
    // 回退到逐个处理
    return await Promise.all(questions.map(async q => {
      const text = typeof q === 'string' ? q : q.text || q.question || ''
      const maskedText = await maskSensitiveInfoAsync(text)
      return {
        ...q,
        text: maskedText
      }
    }))
  }
}

/**
 * 获取敏感信息检测建议
 * @param text 要检测的文本
 * @returns 检测建议
 */
export function getSensitivityAdvice(text: string): string[] {
  const advice: string[] = []
  
  if (!text) return advice
  
  // 检测姓名
  const namePattern = /[\u4e00-\u9fa5]{2,4}/g
  let match
  while ((match = namePattern.exec(text)) !== null) {
    if (isPossibleName(match[0])) {
      advice.push(`检测到可能的人名信息: ${match[0]}`)
    }
  }
  
  if (/1[3-9]\d{9}/.test(text)) {
    advice.push('检测到手机号码')
  }
  
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    advice.push('检测到邮箱地址')
  }
  
  if (/\d{17}[\dXx]/.test(text)) {
    advice.push('检测到身份证号')
  }
  
  
  if (/[\u4e00-\u9fa5]{2,}(省|市|区|县|街道|路|号)/.test(text)) {
    advice.push('检测到具体地址信息')
  }
  
  if (/(公司|部门|团队|组|组别)[\u4e00-\u9fa5]{2,10}/.test(text)) {
    advice.push('检测到公司内部信息')
  }
  
  return advice
}
