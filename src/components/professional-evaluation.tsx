import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react'

interface ProfessionalEvaluationProps {
  evaluation: {
    technicalAccuracy: string
    completeness: string
    clarity: string
    depth: string
    specificFeedback: string
    missingPoints: string
    strengths: string
    improvements: string
  }
  questionType?: string
  difficulty?: string
}

export function ProfessionalEvaluation({ evaluation, questionType, difficulty }: ProfessionalEvaluationProps) {
  return (
    <div className="space-y-4">
      {/* 专业评价 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            专业评价
            <Badge variant="outline" className="ml-auto">
              {questionType || '技术问题'}
            </Badge>
            {difficulty && (
              <Badge variant="secondary">
                {difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 具体反馈 */}
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">具体评价</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                {evaluation.specificFeedback}
              </p>
            </div>

            {/* 优势 */}
            {evaluation.strengths && (
              <div>
                <h4 className="font-medium text-green-700 mb-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  回答亮点
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {evaluation.strengths}
                </p>
              </div>
            )}

            {/* 需要改进的地方 */}
            {evaluation.improvements && (
              <div>
                <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  改进建议
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {evaluation.improvements}
                </p>
              </div>
            )}

            {/* 遗漏的关键点 */}
            {evaluation.missingPoints && (
              <div>
                <h4 className="font-medium text-red-700 mb-2 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  遗漏要点
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {evaluation.missingPoints}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 评价维度 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">评价维度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">技术准确性</span>
              </div>
              <p className="text-xs text-gray-600">{evaluation.technicalAccuracy}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">回答完整性</span>
              </div>
              <p className="text-xs text-gray-600">{evaluation.completeness}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">表达清晰度</span>
              </div>
              <p className="text-xs text-gray-600">{evaluation.clarity}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">技术深度</span>
              </div>
              <p className="text-xs text-gray-600">{evaluation.depth}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 推荐答案组件
interface RecommendedAnswerProps {
  recommendedAnswer: {
    structure: string
    keyPoints: string[]
    technicalDetails: string
    examples: string
    bestPractices: string
  }
}

export function RecommendedAnswer({ recommendedAnswer }: RecommendedAnswerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="w-5 h-5 text-blue-600" />
          AI推荐答案
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 回答结构 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">回答结构</h4>
          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
            {recommendedAnswer.structure}
          </p>
        </div>

        {/* 关键要点 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">关键要点</h4>
          <ul className="space-y-1">
            {recommendedAnswer.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 技术细节 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">技术细节</h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {recommendedAnswer.technicalDetails}
          </p>
        </div>

        {/* 具体示例 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">具体示例</h4>
          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
            {recommendedAnswer.examples}
          </p>
        </div>

        {/* 最佳实践 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">最佳实践</h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {recommendedAnswer.bestPractices}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
