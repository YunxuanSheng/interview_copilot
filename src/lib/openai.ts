import OpenAI from 'openai'

// 获取API密钥（不立即检查，避免在模块加载时输出错误）
// 支持通义千问的DashScope API Key
// 注意：OpenAI兼容模式需要 API Key（格式：sk-xxx），不是 AccessKey
const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY
const isDashScope = !!process.env.DASHSCOPE_API_KEY
const baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

// 在服务端初始化时输出配置信息
if (typeof window === 'undefined' && apiKey) {
  const apiKeyPrefix = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4)
  console.log('🔧 AI服务配置:')
  console.log('  ✅ 使用服务:', isDashScope ? '通义千问 (DashScope)' : 'OpenAI (兼容模式)')
  console.log('  📍 API端点:', baseURL)
  console.log('  🔑 API Key:', apiKeyPrefix)
  console.log('  📝 说明: OpenAI兼容模式，但实际调用通义千问API')
}

// 创建OpenAI兼容客户端实例（仅在服务端使用）
// 使用通义千问的OpenAI兼容模式
export const openai = typeof window === 'undefined' && apiKey 
  ? new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    })
  : null

// 检查API密钥是否存在的辅助函数
function checkApiKey(): boolean {
  if (!apiKey) {
    console.warn('⚠️ DASHSCOPE_API_KEY 环境变量未设置')
    console.warn('请在 .env.local 文件中添加: DASHSCOPE_API_KEY=your_api_key_here')
    console.warn('或者使用旧的 OPENAI_API_KEY (将自动兼容)')
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
    console.error('❌ 通义千问客户端未初始化（可能在客户端环境中）')
    return false
  }
  
  try {
    await openai.models.list()
    console.log('✅ 通义千问 API 密钥验证成功')
    return true
  } catch (error) {
    console.error('❌ 通义千问 API 密钥验证失败:', error)
    return false
  }
}
