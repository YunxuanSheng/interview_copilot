"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Building, Code, Cpu, MessageSquare, Star, FileText, Target } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const questionTypes = [
  { value: "algorithm", label: "算法题", icon: Code, description: "编程算法和数据结构相关题目" },
  { value: "system_design", label: "系统设计", icon: Cpu, description: "系统架构和设计相关题目" },
  { value: "behavioral", label: "行为面试", icon: MessageSquare, description: "软技能和团队协作相关题目" },
  { value: "technical", label: "技术问题", icon: Star, description: "技术知识和经验相关题目" }
]

export default function NewExperiencePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    company: "",
    questionType: "",
    questionText: "",
    answerText: "",
    difficulty: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast.error("请先登录")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/experiences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("面经记录创建成功！")
        router.push("/experiences")
      } else {
        toast.error("创建失败，请重试")
      }
    } catch (error) {
      console.error("Create experience error:", error)
      toast.error("创建失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const selectedQuestionType = questionTypes.find(qt => qt.value === formData.questionType)

  // 显示加载状态，避免页面刷新时的闪烁
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可添加面经记录</p>
          <Button asChild>
            <Link href="/auth/signin">立即登录</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/experiences">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">添加面经记录</h1>
          <p className="text-gray-600 mt-1">记录您的面试题目和经验</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>面经信息</CardTitle>
          <CardDescription>
            请填写完整的面试题目信息，所有带 * 的字段为必填项
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                公司名称 *
              </Label>
              <Input
                id="company"
                placeholder="例如：腾讯"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                required
              />
            </div>

            {/* Question Type */}
            <div className="space-y-2">
              <Label htmlFor="questionType">题目类型 *</Label>
              <Select value={formData.questionType} onValueChange={(value) => handleInputChange("questionType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择题目类型" />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map(type => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <Label htmlFor="questionText" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                面试题目 *
              </Label>
              <Textarea
                id="questionText"
                placeholder="请详细描述面试题目..."
                value={formData.questionText}
                onChange={(e) => handleInputChange("questionText", e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Answer Text */}
            <div className="space-y-2">
              <Label htmlFor="answerText">我的答案</Label>
              <Textarea
                id="answerText"
                placeholder="记录您的回答思路和答案..."
                value={formData.answerText}
                onChange={(e) => handleInputChange("answerText", e.target.value)}
                rows={6}
              />
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                难度等级
              </Label>
              <Select value={formData.difficulty} onValueChange={(value) => handleInputChange("difficulty", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择难度等级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>简单</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>中等</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="hard">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>困难</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Question Type Info */}
            {selectedQuestionType && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const Icon = selectedQuestionType.icon
                    return <Icon className="w-5 h-5 text-blue-600" />
                  })()}
                  <h4 className="font-medium text-blue-900">{selectedQuestionType.label}</h4>
                </div>
                <p className="text-sm text-blue-700">{selectedQuestionType.description}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "创建中..." : "创建面经记录"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/experiences">取消</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
