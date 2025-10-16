import OpenAI from 'openai'

// 获取API密钥（不立即检查，避免在模块加载时输出错误）
const apiKey = process.env.OPENAI_API_KEY

// 创建OpenAI客户端实例（仅在服务端使用）
export const openai = typeof window === 'undefined' && apiKey 
  ? new OpenAI({
      apiKey: apiKey,
    })
  : null

// 检查API密钥是否存在的辅助函数
function checkApiKey(): boolean {
  if (!apiKey) {
    console.warn('⚠️ OPENAI_API_KEY 环境变量未设置')
    console.warn('请在 .env.local 文件中添加: OPENAI_API_KEY=your_api_key_here')
    return false
  }
  return true
}

// 验证API密钥是否有效
export async function validateOpenAIKey(): Promise<boolean> {
  if (!checkApiKey()) {
    return false
  }
  
  if (!openai) {
    console.error('❌ OpenAI 客户端未初始化（可能在客户端环境中）')
    return false
  }
  
  try {
    await openai.models.list()
    console.log('✅ OpenAI API 密钥验证成功')
    return true
  } catch (error) {
    console.error('❌ OpenAI API 密钥验证失败:', error)
    return false
  }
}
