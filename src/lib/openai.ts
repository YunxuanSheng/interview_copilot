import OpenAI from 'openai'

// 创建OpenAI客户端实例
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 验证API密钥是否有效
export async function validateOpenAIKey(): Promise<boolean> {
  try {
    await openai.models.list()
    return true
  } catch (error) {
    console.error('OpenAI API key validation failed:', error)
    return false
  }
}
