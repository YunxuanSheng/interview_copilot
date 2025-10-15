import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertTriangle, Lightbulb, Target, BookOpen, Code, MessageSquare } from 'lucide-react'

interface AIAnalysis {
  overallScore?: number
  strengths: Array<{
    category: string
    description: string
    evidence: string
  }>
  weaknesses: Array<{
    category: string
    description: string
    impact: string
    improvement: string
  }>
  suggestions: Array<{
    priority: string
    category: string
    suggestion: string
    actionable: string
  }>
  questionAnalysis?: Array<{
    question: string
    answer: string
    questionType: string
    difficulty: string
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
  }>
}

interface MergedAnalysisProps {
  analysis: AIAnalysis
}

export function MergedAnalysis({ analysis }: MergedAnalysisProps) {
  // 按类别分组优势
  const groupedStrengths = analysis.strengths.reduce((acc, strength) => {
    if (!acc[strength.category]) {
      acc[strength.category] = []
    }
    acc[strength.category].push(strength)
    return acc
  }, {} as Record<string, typeof analysis.strengths>)

  // 按类别分组不足
  const groupedWeaknesses = analysis.weaknesses.reduce((acc, weakness) => {
    if (!acc[weakness.category]) {
      acc[weakness.category] = []
    }
    acc[weakness.category].push(weakness)
    return acc
  }, {} as Record<string, typeof analysis.weaknesses>)

  // 按优先级分组建议
  const groupedSuggestions = analysis.suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.priority]) {
      acc[suggestion.priority] = []
    }
    acc[suggestion.priority].push(suggestion)
    return acc
  }, {} as Record<string, typeof analysis.suggestions>)

  // 按问题类型分组题目分析
  const groupedQuestions = analysis.questionAnalysis?.reduce((acc, qa) => {
    if (!acc[qa.questionType]) {
      acc[qa.questionType] = []
    }
    acc[qa.questionType].push(qa)
    return acc
  }, {} as Record<string, NonNullable<typeof analysis.questionAnalysis>>) || {}

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case '技术能力':
      case 'technical':
        return <Code className="w-4 h-4" />
      case '沟通表达':
      case 'communication':
        return <MessageSquare className="w-4 h-4" />
      case '学习能力':
      case 'learning':
        return <BookOpen className="w-4 h-4" />
      case '经验背景':
      case 'experience':
        return <Target className="w-4 h-4" />
      default:
        return <CheckCircle className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'medium':
        return 'text-orange-700 bg-orange-50 border-orange-200'
      case 'low':
        return 'text-blue-700 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'algorithm':
        return '算法题'
      case 'system_design':
        return '系统设计'
      case 'behavioral':
        return '行为面试'
      case 'technical':
        return '技术问题'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      {/* 综合优势分析 */}
      {Object.keys(groupedStrengths).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              综合优势分析
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(groupedStrengths).map(([category, strengths]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2 text-lg font-medium text-gray-900">
                  {getCategoryIcon(category)}
                  {category}
                </div>
                <div className="space-y-2 ml-6">
                  {strengths.map((strength, index) => (
                    <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="font-medium text-green-800 mb-1">
                        {strength.description}
                      </div>
                      <div className="text-sm text-green-700">
                        <span className="font-medium">具体表现：</span>
                        {strength.evidence}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 综合不足分析 */}
      {Object.keys(groupedWeaknesses).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              综合不足分析
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(groupedWeaknesses).map(([category, weaknesses]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2 text-lg font-medium text-gray-900">
                  {getCategoryIcon(category)}
                  {category}
                </div>
                <div className="space-y-2 ml-6">
                  {weaknesses.map((weakness, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="font-medium text-red-800 mb-2">
                        {weakness.description}
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="text-red-700">
                          <span className="font-medium">影响程度：</span>
                          {weakness.impact}
                        </div>
                        <div className="text-red-600">
                          <span className="font-medium">改进方向：</span>
                          {weakness.improvement}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 综合改进建议 */}
      {Object.keys(groupedSuggestions).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Lightbulb className="w-5 h-5" />
              综合改进建议
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(groupedSuggestions).map(([priority, suggestions]) => (
              <div key={priority} className="space-y-3">
                <div className={`flex items-center gap-2 text-lg font-medium px-3 py-2 rounded-lg border ${getPriorityColor(priority)}`}>
                  <Target className="w-4 h-4" />
                  {priority === 'high' ? '高优先级' : priority === 'medium' ? '中优先级' : '低优先级'}建议
                </div>
                <div className="space-y-2 ml-6">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="font-medium text-blue-800">
                          {suggestion.suggestion}
                        </div>
                      </div>
                      <div className="text-sm text-blue-700 ml-4">
                        <span className="font-medium">具体行动：</span>
                        {suggestion.actionable}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 题目类型分析总结 */}
      {Object.keys(groupedQuestions).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <BookOpen className="w-5 h-5" />
              题目类型分析总结
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(groupedQuestions).map(([questionType, questions]) => (
              <div key={questionType} className="space-y-3">
                <div className="flex items-center gap-2 text-lg font-medium text-gray-900">
                  {getCategoryIcon(questionType)}
                  {getQuestionTypeLabel(questionType)} ({questions.length}题)
                </div>
                <div className="space-y-2 ml-6">
                  {questions.map((qa, index) => (
                    <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="font-medium text-purple-800 mb-2">
                        问题：{qa.question}
                      </div>
                      <div className="text-sm text-purple-700 mb-2">
                        <span className="font-medium">回答：</span>
                        {qa.answer || '未回答'}
                      </div>
                      <div className="text-sm text-purple-600 space-y-1">
                        <div>
                          <span className="font-medium">技术准确性：</span>
                          {qa.evaluation.technicalAccuracy}
                        </div>
                        <div>
                          <span className="font-medium">回答完整性：</span>
                          {qa.evaluation.completeness}
                        </div>
                        <div>
                          <span className="font-medium">表达清晰度：</span>
                          {qa.evaluation.clarity}
                        </div>
                        <div>
                          <span className="font-medium">技术深度：</span>
                          {qa.evaluation.depth}
                        </div>
                        {qa.evaluation.specificFeedback && (
                          <div className="mt-2 p-2 bg-white rounded border">
                            <span className="font-medium">具体反馈：</span>
                            {qa.evaluation.specificFeedback}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
