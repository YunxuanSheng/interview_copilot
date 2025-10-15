import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Trash2, Edit } from 'lucide-react'

interface Question {
  id: string
  questionText: string
  userAnswer: string
  aiEvaluation: string
  recommendedAnswer?: string
  questionType: string
}

interface QuestionDisplayProps {
  question: Question
  index: number
  onUpdate: (id: string, field: string, value: string) => void
  onRemove: (id: string) => void
}

export function QuestionDisplay({ question, index, onUpdate, onRemove }: QuestionDisplayProps) {
  // 格式化AI评价显示
  const formatEvaluation = (evaluation: string) => {
    try {
      const parsed = JSON.parse(evaluation)
      if (typeof parsed === 'object' && parsed !== null) {
        // 如果是对象，提取关键信息
        if (parsed.specificFeedback) {
          return parsed.specificFeedback
        } else if (parsed.feedback) {
          return parsed.feedback
        } else {
          // 构建友好的评价文本
          let result = ""
          if (parsed.technicalAccuracy) {
            result += `技术准确性: ${parsed.technicalAccuracy}\n`
          }
          if (parsed.completeness) {
            result += `完整性: ${parsed.completeness}\n`
          }
          if (parsed.clarity) {
            result += `表达清晰度: ${parsed.clarity}\n`
          }
          if (parsed.depth) {
            result += `技术深度: ${parsed.depth}`
          }
          return result.trim() || evaluation
        }
      }
    } catch {
      // 如果不是JSON，直接返回
    }
    return evaluation
  }

  // 格式化推荐答案显示
  const formatRecommendedAnswer = (answer: string) => {
    try {
      const parsed = JSON.parse(answer)
      if (typeof parsed === 'object' && parsed !== null) {
        // 如果是对象，提取关键信息
        let result = ""
        if (parsed.structure) {
          result += `**结构：** ${parsed.structure}\n\n`
        }
        if (parsed.keyPoints && Array.isArray(parsed.keyPoints)) {
          result += `**关键要点：**\n${parsed.keyPoints.map((point: string, i: number) => `${i + 1}. ${point}`).join('\n')}\n\n`
        }
        if (parsed.technicalDetails) {
          result += `**技术细节：** ${parsed.technicalDetails}\n\n`
        }
        if (parsed.examples) {
          result += `**示例：** ${parsed.examples}\n\n`
        }
        if (parsed.bestPractices) {
          result += `**最佳实践：** ${parsed.bestPractices}`
        }
        return result.trim() || answer
      }
    } catch {
      // 如果不是JSON，直接返回
    }
    return answer
  }

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">题目 {index + 1}</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(question.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <Label>题目内容</Label>
        <Textarea
          placeholder="请输入面试题目..."
          value={question.questionText}
          onChange={(e) => onUpdate(question.id, "questionText", e.target.value)}
          rows={2}
        />
      </div>
      
      <div className="space-y-2">
        <Label>我的回答</Label>
        <Textarea
          placeholder="记录您的回答..."
          value={question.userAnswer}
          onChange={(e) => onUpdate(question.id, "userAnswer", e.target.value)}
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>题目类型</Label>
          <Select
            value={question.questionType}
            onValueChange={(value) => onUpdate(question.id, "questionType", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="algorithm">算法题</SelectItem>
              <SelectItem value="system_design">系统设计</SelectItem>
              <SelectItem value="behavioral">行为面试</SelectItem>
              <SelectItem value="technical">技术问题</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>难度</Label>
          <Select
            value={question.questionType}
            onValueChange={(value) => onUpdate(question.id, "questionType", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">简单</SelectItem>
              <SelectItem value="medium">中等</SelectItem>
              <SelectItem value="hard">困难</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>AI评价</Label>
        <Textarea
          placeholder="AI对回答的评价和建议..."
          value={formatEvaluation(question.aiEvaluation)}
          onChange={(e) => onUpdate(question.id, "aiEvaluation", e.target.value)}
          rows={3}
          className="bg-blue-50"
        />
      </div>
      
      {question.recommendedAnswer && (
        <div className="space-y-2">
          <Label>推荐答案</Label>
          <Textarea
            placeholder="AI推荐的标准答案..."
            value={formatRecommendedAnswer(question.recommendedAnswer)}
            onChange={(e) => onUpdate(question.id, "recommendedAnswer", e.target.value)}
            rows={4}
            className="bg-green-50"
          />
        </div>
      )}
    </div>
  )
}
