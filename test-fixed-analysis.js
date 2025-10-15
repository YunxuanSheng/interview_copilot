// 测试修复后的AI分析功能
const testTranscript = `面试官：宇轩你好,你能不能做个简单的自我介绍?  
候选人：面试官你好,我叫盛宇轩,我之前就读于宁波诺丁汉大学的计算机科学技术专业,后面在美国的密歇根大学读电气与计算机工程。现在我在自己的商业化团队下面做前端开发工程师,我们的团队主要做的是一个客服平台,为非熟懂车地,巨量广告等业务线提供与商户广告主沟通的能力。我的技术站主要是reactor type script。  
面试官：好的,同学,那我们现在进行一下技术知识的问答,想问一下你知不知道什么主要的react hooks?  
候选人：我知道,比如说像是useRef,useState,useCallback这些。  
面试官：同学,那你能不能介绍一下ES5和ES6的区别?  
候选人：ES6我记得是支持了LAT,同时也有箭头函数这些,然后还有一些别的东西,但是我这边音响不是很清楚。  
面试官：好的,同学,你能不能现在写一道算法题,实现一个快速排序,用JavaScript?  
候选人：好的。  
面试官：谢谢同学,想问一下你有什么问题想问的吗?  
候选人：没有了。  
面试官：那么我们今天的面试就到这里了。  
候选人：好的,谢谢面试馆,再见。`

async function testFixedAnalysis() {
  try {
    console.log('测试修复后的AI分析功能...')
    console.log('面试内容长度:', testTranscript.length, '字符')
    console.log('面试内容预览:')
    console.log(testTranscript.substring(0, 200) + '...')
    
    // 等待服务器启动
    console.log('等待服务器启动...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
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
      console.log('\n=== AI分析结果 ===')
      console.log('成功:', result.success)
      console.log('消息:', result.message)
      
      if (result.data) {
        console.log('\n=== 优势分析 ===')
        console.log('优势数量:', result.data.strengths?.length || 0)
        if (result.data.strengths?.length > 0) {
          result.data.strengths.forEach((s, index) => {
            console.log(`${index + 1}. ${s.category}: ${s.description}`)
          })
        }
        
        console.log('\n=== 不足分析 ===')
        console.log('不足数量:', result.data.weaknesses?.length || 0)
        if (result.data.weaknesses?.length > 0) {
          result.data.weaknesses.forEach((w, index) => {
            console.log(`${index + 1}. ${w.category}: ${w.description}`)
          })
        }
        
        console.log('\n=== 问题分析 ===')
        console.log('问题数量:', result.data.questionAnalysis?.length || 0)
        if (result.data.questionAnalysis?.length > 0) {
          result.data.questionAnalysis.forEach((q, index) => {
            console.log(`\n问题 ${index + 1}:`)
            console.log('问题:', q.question)
            console.log('回答:', q.answer)
            console.log('类型:', q.questionType)
            console.log('难度:', q.difficulty)
          })
        } else {
          console.log('❌ 未提取到任何问题分析')
        }
      } else {
        console.log('❌ 没有返回分析数据')
      }
    } else {
      console.error('❌ API调用失败:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('错误详情:', errorText)
    }
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testFixedAnalysis()
