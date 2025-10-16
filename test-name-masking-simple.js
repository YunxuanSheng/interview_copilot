// 简化的姓名脱敏测试
const COMMON_SURNAMES = [
  '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
  '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕',
  '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎', '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜',
  '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆', '郝', '孔', '白', '崔', '康', '毛', '邱', '秦', '江', '史',
  '顾', '侯', '邵', '孟', '龙', '万', '段', '漕', '钱', '汤', '尹', '黎', '易', '常', '武', '乔', '贺', '赖', '龚', '文'
]

// 检测是否为可能的姓名
function isPossibleName(text) {
  // 长度检查：2-4个字符
  if (text.length < 2 || text.length > 4) return false
  
  // 必须全部是中文字符
  if (!/^[\u4e00-\u9fa5]+$/.test(text)) return false
  
  // 检查是否以常见姓氏开头
  const firstChar = text[0]
  if (!COMMON_SURNAMES.includes(firstChar)) return false
  
  // 排除一些明显不是姓名的词汇
  const excludeWords = [
    '公司', '部门', '团队', '项目', '产品', '技术', '开发', '设计', '运营', '市场',
    '销售', '财务', '人事', '行政', '管理', '服务', '系统', '平台', '应用', '软件',
    '硬件', '网络', '数据', '算法', '模型', '框架', '工具', '方法', '策略', '方案',
    '计划', '目标', '任务', '工作', '业务', '流程', '标准', '规范', '规则', '制度'
  ]
  
  if (excludeWords.includes(text)) return false
  
  return true
}

// 对姓名进行脱敏处理
function maskNames(text) {
  // 匹配2-4个连续的中文字符
  return text.replace(/[\u4e00-\u9fa5]{2,4}/g, (match) => {
    if (isPossibleName(match)) {
      // 保留姓氏，隐藏名字
      if (match.length === 2) {
        return match[0] + '*'
      } else if (match.length === 3) {
        return match[0] + '**'
      } else if (match.length === 4) {
        return match[0] + '***'
      }
    }
    return match
  })
}

// 获取敏感信息检测建议
function getSensitivityAdvice(text) {
  const advice = []
  
  if (!text) return advice
  
  // 检测姓名
  const namePattern = /[\u4e00-\u9fa5]{2,4}/g
  let match
  while ((match = namePattern.exec(text)) !== null) {
    if (isPossibleName(match[0])) {
      advice.push(`检测到可能的人名信息: ${match[0]}`)
    }
  }
  
  if (/1[3-9]\d{9}/.test(text)) {
    advice.push('检测到手机号码')
  }
  
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    advice.push('检测到邮箱地址')
  }
  
  if (/(\d+[万千百]?元?|\d+[kK]|\d+[wW])/.test(text)) {
    advice.push('检测到薪资信息')
  }
  
  return advice
}

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
  "地址在北京市朝阳区",
  "王小明和李小红是好朋友",
  "张工程师很厉害",
  "刘经理负责这个项目"
]

console.log('=== 姓名脱敏测试 ===\n')

testCases.forEach((text, index) => {
  console.log(`测试 ${index + 1}: ${text}`)
  
  const advice = getSensitivityAdvice(text)
  if (advice.length > 0) {
    console.log(`检测到敏感信息: ${advice.join(', ')}`)
  }
  
  const masked = maskNames(text)
  console.log(`脱敏后: ${masked}`)
  console.log('---')
})
