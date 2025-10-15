/**
 * 隐私保护工具函数
 */

// 敏感信息脱敏规则
const SENSITIVE_PATTERNS = [
  // 姓名模式 - 中文姓名
  { pattern: /[\u4e00-\u9fa5]{2,4}/g, replacement: '***' },
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
  // 薪资相关
  { pattern: /(\d+[万千百]?元?|\d+[kK]|\d+[wW])/g, replacement: '***' },
  // 具体地址
  { pattern: /[\u4e00-\u9fa5]{2,}(省|市|区|县|街道|路|号)/g, replacement: '***' },
  // 具体时间（保留年份和月份，隐藏具体日期）
  { pattern: /(\d{4})年(\d{1,2})月(\d{1,2})日/g, replacement: '$1年$2月**日' },
  // 具体时间（保留年份，隐藏月份和日期）
  { pattern: /(\d{4})年(\d{1,2})月/g, replacement: '$1年**月' },
]

/**
 * 对文本进行脱敏处理
 * @param text 原始文本
 * @returns 脱敏后的文本
 */
export function maskSensitiveInfo(text: string): string {
  if (!text) return text
  
  let maskedText = text
  
  // 应用所有脱敏规则
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
  
  return SENSITIVE_PATTERNS.some(({ pattern }) => pattern.test(text))
}

/**
 * 对面试问题和答案进行脱敏处理
 * @param questions 问题列表
 * @param answers 答案列表
 * @param enableAnswerSharing 是否分享答案
 * @param enablePersonalInfo 是否分享个人信息
 * @returns 脱敏后的问题和答案
 */
export function maskInterviewContent(
  questions: any[],
  answers: any[] = [],
  enableAnswerSharing: boolean = false,
  enablePersonalInfo: boolean = false
) {
  const maskedQuestions = questions.map((question, index) => {
    const questionText = typeof question === 'string' ? question : question.text || question.question || ''
    
    // 如果允许分享个人信息，只对明显敏感的信息进行脱敏
    // 如果不允许，则进行完整脱敏
    const maskedQuestionText = enablePersonalInfo 
      ? maskSensitiveInfo(questionText)
      : maskSensitiveInfo(questionText)
    
    return {
      ...question,
      text: maskedQuestionText,
      originalText: questionText
    }
  })
  
  const maskedAnswers = enableAnswerSharing 
    ? answers.map((answer, index) => {
        const answerText = typeof answer === 'string' ? answer : answer.text || ''
        const maskedAnswerText = enablePersonalInfo 
          ? maskSensitiveInfo(answerText)
          : maskSensitiveInfo(answerText)
        
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
 * 获取敏感信息检测建议
 * @param text 要检测的文本
 * @returns 检测建议
 */
export function getSensitivityAdvice(text: string): string[] {
  const advice: string[] = []
  
  if (!text) return advice
  
  // 检测各种敏感信息
  if (/[\u4e00-\u9fa5]{2,4}/.test(text)) {
    advice.push('检测到可能的人名信息')
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
  
  if (/(\d+[万千百]?元?|\d+[kK]|\d+[wW])/.test(text)) {
    advice.push('检测到薪资信息')
  }
  
  if (/[\u4e00-\u9fa5]{2,}(省|市|区|县|街道|路|号)/.test(text)) {
    advice.push('检测到具体地址信息')
  }
  
  if (/(公司|部门|团队|组|组别)[\u4e00-\u9fa5]{2,10}/.test(text)) {
    advice.push('检测到公司内部信息')
  }
  
  return advice
}
