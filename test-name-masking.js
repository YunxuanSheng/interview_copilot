const { maskSensitiveInfo, getSensitivityAdvice } = require('./src/lib/privacy-utils.ts')

// 测试姓名脱敏功能
const testCases = [
  "我叫张三，在腾讯工作",
  "李四和王五都是我的同事",
  "面试官是赵六，人很好",
  "我们团队有陈七、刘八、周九",
  "公司部门有很多人",
  "技术开发团队很强大",
  "产品设计需要改进",
  "我的手机号是13812345678",
  "邮箱是zhangsan@example.com",
  "薪资是15k",
  "地址在北京市朝阳区"
]

console.log('=== 姓名脱敏测试 ===\n')

testCases.forEach((text, index) => {
  console.log(`测试 ${index + 1}: ${text}`)
  
  const advice = getSensitivityAdvice(text)
  if (advice.length > 0) {
    console.log(`检测到敏感信息: ${advice.join(', ')}`)
  }
  
  const masked = maskSensitiveInfo(text)
  console.log(`脱敏后: ${masked}`)
  console.log('---')
})
