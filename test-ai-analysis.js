// 测试AI分析功能
const testTranscript = `宇轩你好,你能不能做个简单的自我介绍? 面试官你好,我叫盛宇轩,我之前就读于宁波诺丁汉大学的计算机科学技术专业,后面在美国的密歇根大学读电气与计算机工程。 现在我在自己的商业化团队下面做前端开发工程师,我们的团队主要做的是一个客服平台,为非熟懂车地,巨量广告等业务线提供与商户广告主沟通的能力。 我的技术站主要是reactor type script。 好的,同学,那我们现在进行一下 技术知识的问答,想问一下你知不知道什么主要的react hooks? 我知道,比如说像是useRef,useState,useCallback这些。 同学,那你能不能介绍一下ES5和ES6的区别? ES6我记得是支持了LAT,同时也有箭头函数这些,然后还有一些别的东西,但是我这边音响不是很清楚。 好的,同学,你能不能现在写一道算法题,实现一个快速排序,用JavaScript? 好的。 谢谢同学,想问一下你有什么问题想问的吗? 没有了。 那么我们今天的面试就到这里了。 好的,谢谢面试馆,再见。`

async function testAIAnalysis() {
  try {
    console.log('测试AI分析功能...')
    console.log('面试内容长度:', testTranscript.length, '字符')
    
    const response = await fetch('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'analyze',
        data: { transcript: testTranscript }
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log('AI分析结果:')
      console.log('成功:', result.success)
      console.log('消息:', result.message)
      
      if (result.data && result.data.questionAnalysis) {
        console.log('提取到的问题数量:', result.data.questionAnalysis.length)
        result.data.questionAnalysis.forEach((q, index) => {
          console.log(`\n问题 ${index + 1}:`)
          console.log('问题:', q.question)
          console.log('回答:', q.answer)
          console.log('类型:', q.questionType)
        })
      } else {
        console.log('未提取到问题分析')
      }
    } else {
      console.error('API调用失败:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('测试失败:', error)
  }
}

// 运行测试
testAIAnalysis()
