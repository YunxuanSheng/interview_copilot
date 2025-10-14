// 测试OpenAI API连接
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    console.log('正在测试OpenAI API连接...');
    
    // 测试API密钥是否有效
    const models = await openai.models.list();
    console.log('✅ OpenAI API连接成功！');
    console.log('可用模型数量:', models.data.length);
    
    // 测试简单的聊天完成
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "请用一句话介绍你自己"
        }
      ],
      max_tokens: 100
    });
    
    console.log('✅ 聊天完成测试成功！');
    console.log('AI回复:', completion.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ OpenAI API测试失败:', error.message);
  }
}

testOpenAI();
