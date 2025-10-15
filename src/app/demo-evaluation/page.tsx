"use client"

import { ProfessionalEvaluation, RecommendedAnswer } from "@/components/professional-evaluation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DemoEvaluationPage() {
  // 模拟不同问题类型的评价数据
  const demoEvaluations = {
    algorithm: {
      evaluation: {
        score: 85,
        technicalAccuracy: "算法实现正确，时间复杂度分析准确，能处理边界情况",
        completeness: "覆盖了问题的主要要求，考虑了部分边界情况",
        clarity: "思路清晰，代码结构良好，表达准确",
        depth: "理解算法原理，能提出基本优化方案",
        specificFeedback: "在回答快速排序问题时，正确实现了算法逻辑，时间复杂度分析准确。代码结构清晰，变量命名规范。但在处理重复元素和优化方面还有提升空间。",
        missingPoints: "1. 未考虑重复元素的处理 2. 缺少随机化版本的优化 3. 未提及三路快排的改进",
        strengths: "算法实现正确，时间复杂度分析准确，代码可读性好",
        improvements: "建议学习处理重复元素的优化方案，了解随机化快排和三路快排的实现"
      },
      questionType: "算法",
      difficulty: "medium"
    },
    systemDesign: {
      evaluation: {
        score: 72,
        technicalAccuracy: "技术选型基本合理，但部分组件选择不够优化",
        completeness: "覆盖了主要功能模块，但缺少非功能性需求考虑",
        clarity: "设计思路基本清晰，但架构图表达不够详细",
        depth: "对系统设计原理理解一般，实践经验有限",
        specificFeedback: "在设计聊天系统时，正确选择了WebSocket进行实时通信，数据库设计基本合理。但在高并发处理、缓存策略和监控系统方面考虑不足。",
        missingPoints: "1. 缺少负载均衡和水平扩展方案 2. 未考虑缓存策略 3. 缺少监控和日志系统 4. 未考虑数据一致性",
        strengths: "技术选型合理，基本架构清晰，考虑了主要功能模块",
        improvements: "建议深入学习微服务架构、缓存策略和分布式系统设计原则"
      },
      questionType: "系统设计",
      difficulty: "hard"
    },
    technical: {
      evaluation: {
        score: 90,
        technicalAccuracy: "技术概念完全正确，实现方案可行且高效",
        completeness: "回答全面，覆盖了所有关键点，提供了具体示例",
        clarity: "逻辑清晰，表达准确，易于理解",
        depth: "理解深入，能联系相关技术，有独到见解",
        specificFeedback: "在解释React Hooks时，不仅准确说明了基本概念，还深入分析了useEffect的依赖数组机制，并提供了实际项目中的使用经验。回答结构清晰，示例具体。",
        missingPoints: "无",
        strengths: "技术理解深入，表达清晰，有实际项目经验，能联系相关技术",
        improvements: "继续保持当前水平，可以分享更多实际项目中的最佳实践"
      },
      questionType: "技术",
      difficulty: "medium"
    },
    behavioral: {
      evaluation: {
        score: 78,
        technicalAccuracy: "经历描述真实可信，技术细节较为准确",
        completeness: "基本使用STAR方法，但部分细节不够具体",
        clarity: "表达基本清晰，有一定的故事性",
        depth: "反思较为深入，总结基本到位",
        specificFeedback: "在描述解决技术难题的经历时，使用了STAR方法，但Situation和Task部分描述不够具体，Action部分技术细节较为准确，Result部分有量化指标。",
        missingPoints: "1. 背景描述不够具体 2. 缺少团队协作细节 3. 结果量化不够充分",
        strengths: "使用了STAR方法，技术细节准确，有反思总结",
        improvements: "建议在背景描述中提供更多具体信息，增加团队协作和沟通的细节"
      },
      questionType: "行为",
      difficulty: "medium"
    }
  }

  const demoRecommendedAnswer = {
    structure: "问题理解 → 技术方案 → 实现细节 → 优化考虑 → 总结",
    keyPoints: [
      "明确问题需求和约束条件",
      "选择合适的技术栈和架构",
      "设计核心算法和数据结构",
      "考虑性能优化和扩展性",
      "总结方案的优缺点"
    ],
    technicalDetails: "这是一个典型的系统设计问题，需要考虑高并发、高可用、可扩展等非功能性需求。核心挑战在于如何设计一个能够支持大量用户同时在线、消息实时传递、数据持久化的系统。",
    examples: "以微信为例，需要考虑：1. 用户认证和授权 2. 消息路由和分发 3. 在线状态管理 4. 消息存储和检索 5. 推送通知机制",
    bestPractices: "1. 遵循微服务架构原则 2. 使用消息队列解耦 3. 实现读写分离 4. 采用缓存策略 5. 建立监控体系 6. 考虑数据一致性"
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">专业AI评价系统演示</h1>
        <p className="text-gray-600">
          展示改进后的AI评价系统，提供更专业、具体、有针对性的面试反馈
        </p>
      </div>

      <Tabs defaultValue="algorithm" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="algorithm">算法问题</TabsTrigger>
          <TabsTrigger value="systemDesign">系统设计</TabsTrigger>
          <TabsTrigger value="technical">技术问题</TabsTrigger>
          <TabsTrigger value="behavioral">行为问题</TabsTrigger>
        </TabsList>

        {Object.entries(demoEvaluations).map(([key, data]) => (
          <TabsContent key={key} value={key} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline">{data.questionType}</Badge>
                  <Badge variant="secondary">
                    {data.difficulty === 'easy' ? '简单' : data.difficulty === 'medium' ? '中等' : '困难'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfessionalEvaluation 
                  evaluation={data.evaluation}
                  questionType={data.questionType}
                  difficulty={data.difficulty}
                />
              </CardContent>
            </Card>

            <RecommendedAnswer recommendedAnswer={demoRecommendedAnswer} />
          </TabsContent>
        ))}
      </Tabs>

      {/* 改进说明 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>评价系统改进说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">主要改进</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• <strong>专业评分标准：</strong>针对不同问题类型制定专业的评价标准</li>
              <li>• <strong>详细反馈：</strong>提供具体的优缺点分析和改进建议</li>
              <li>• <strong>量化评分：</strong>从技术准确性、完整性、清晰度、深度四个维度评分</li>
              <li>• <strong>可视化展示：</strong>使用进度条、图标等直观展示评价结果</li>
              <li>• <strong>结构化推荐：</strong>提供结构化的推荐答案，包含关键要点和技术细节</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">评价维度权重</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-medium">技术准确性</div>
                <div className="text-gray-600">40%</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="font-medium">回答完整性</div>
                <div className="text-gray-600">25%</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="font-medium">表达清晰度</div>
                <div className="text-gray-600">20%</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="font-medium">技术深度</div>
                <div className="text-gray-600">15%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
