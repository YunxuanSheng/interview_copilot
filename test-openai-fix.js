// 测试 OpenAI API 修复
require('dotenv').config({ path: '.env.local' })
const { openai, validateOpenAIKey } = require('./src/lib/openai.ts')

async function testOpenAI() {
  console.log('🧪 测试 OpenAI API 配置...')
  
  try {
    // 测试 API 密钥验证
    const isValid = await validateOpenAIKey()
    
    if (isValid) {
      console.log('✅ OpenAI API 配置正常')
    } else {
      console.log('❌ OpenAI API 配置有问题')
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

testOpenAI()
