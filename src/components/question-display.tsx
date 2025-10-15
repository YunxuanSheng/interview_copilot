import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Trash2, Edit, Save, X } from 'lucide-react'
import { SmartTextRenderer } from '@/components/smart-text-renderer'

interface Question {
  id: string
  questionText: string
  userAnswer: string
  aiEvaluation: string
  recommendedAnswer?: string
  questionType: string
  difficulty?: string
  priority?: string
}

interface QuestionDisplayProps {
  question: Question
  index: number
  onUpdate: (id: string, field: string, value: string) => void
  onRemove: (id: string) => void
}

export function QuestionDisplay({ question, index, onUpdate, onRemove }: QuestionDisplayProps) {
  const [isEditingRecommendedAnswer, setIsEditingRecommendedAnswer] = useState(false)
  const [editingRecommendedAnswer, setEditingRecommendedAnswer] = useState(question.recommendedAnswer || "")

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

  // 格式化推荐答案显示 - 支持代码格式和换行
  const formatRecommendedAnswer = (answer: string) => {
    if (!answer) return ""
    
    // 直接返回原始内容，保持换行和格式
    return answer
  }

  // 处理推荐答案编辑
  const handleEditRecommendedAnswer = () => {
    setEditingRecommendedAnswer(question.recommendedAnswer || "")
    setIsEditingRecommendedAnswer(true)
  }

  const handleSaveRecommendedAnswer = () => {
    onUpdate(question.id, "recommendedAnswer", editingRecommendedAnswer)
    setIsEditingRecommendedAnswer(false)
  }

  const handleCancelEditRecommendedAnswer = () => {
    setEditingRecommendedAnswer(question.recommendedAnswer || "")
    setIsEditingRecommendedAnswer(false)
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
        <div className="flex items-center gap-2">
          <Label>优先级</Label>
          <Badge variant={question.priority === 'high' ? 'destructive' : question.priority === 'medium' ? 'default' : 'secondary'}>
            {question.priority === 'high' ? '高优先级' : question.priority === 'medium' ? '中优先级' : '低优先级'}
          </Badge>
        </div>
      </div>
      
      {question.recommendedAnswer && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>推荐答案</Label>
            {!isEditingRecommendedAnswer && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditRecommendedAnswer}
                className="h-8 px-2"
              >
                <Edit className="w-4 h-4 mr-1" />
                编辑
              </Button>
            )}
          </div>
          
          {isEditingRecommendedAnswer ? (
            <div className="space-y-2">
              <Textarea
                placeholder="编辑推荐答案..."
                value={editingRecommendedAnswer}
                onChange={(e) => setEditingRecommendedAnswer(e.target.value)}
                rows={8}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveRecommendedAnswer}
                  className="h-8 px-3"
                >
                  <Save className="w-4 h-4 mr-1" />
                  保存
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEditRecommendedAnswer}
                  className="h-8 px-3"
                >
                  <X className="w-4 h-4 mr-1" />
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border rounded-md p-3 min-h-[100px]">
              <SmartTextRenderer 
                text={formatRecommendedAnswer(question.recommendedAnswer)} 
                className="text-sm leading-relaxed"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
