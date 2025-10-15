// 测试新的简化AI分析功能
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

async function testNewAnalysis() {
  try {
    console.log('=== 测试新的简化AI分析功能 ===')
    console.log('面试内容长度:', testTranscript.length, '字符')
    
    const response = await fetch('http://localhost:3004/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'analyze',
        data: { transcript: testTranscript }
      }),
    })

    console.log('响应状态:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('\n=== API响应 ===')
      console.log('成功:', result.success)
      console.log('消息:', result.message)
      
      if (result.data) {
        console.log('\n=== 新的数据结构检查 ===')
        console.log('综合评分:', result.data.overallScore || '无')
        console.log('strengths数量:', result.data.strengths?.length || 0)
        console.log('weaknesses数量:', result.data.weaknesses?.length || 0)
        console.log('suggestions数量:', result.data.suggestions?.length || 0)
        console.log('comprehensiveFeedback存在:', !!result.data.comprehensiveFeedback)
        
        if (result.data.comprehensiveFeedback) {
          console.log('\n=== 综合反馈内容 ===')
          console.log('技术能力评估:', result.data.comprehensiveFeedback.technicalAssessment ? '有' : '无')
          console.log('沟通表达能力:', result.data.comprehensiveFeedback.communicationSkills ? '有' : '无')
          console.log('学习潜力:', result.data.comprehensiveFeedback.learningPotential ? '有' : '无')
          console.log('项目经验评价:', result.data.comprehensiveFeedback.experienceEvaluation ? '有' : '无')
          console.log('整体印象:', result.data.comprehensiveFeedback.overallImpression ? '有' : '无')
          console.log('关键亮点:', result.data.comprehensiveFeedback.keyHighlights ? '有' : '无')
          console.log('主要关注点:', result.data.comprehensiveFeedback.mainConcerns ? '有' : '无')
          console.log('推荐建议:', result.data.comprehensiveFeedback.recommendation ? '有' : '无')
        }
        
        console.log('\n=== 完整结果预览 ===')
        console.log(JSON.stringify(result.data, null, 2).substring(0, 1000) + '...')
      } else {
        console.log('❌ 没有返回data字段')
      }
    } else {
      console.error('❌ API调用失败:', response.status)
      const errorText = await response.text()
      console.error('错误详情:', errorText)
    }
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testNewAnalysis()
