"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"

const ROLES = [
  "前端开发",
  "后端开发", 
  "全栈开发",
  "产品经理",
  "UI/UX设计师",
  "测试工程师",
  "算法工程师",
  "运维工程师",
  "数据分析师",
  "项目经理"
]

export default function NewProjectPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    description: "",
    timeRange: "",
    techStack: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.role || !formData.description) {
      alert("请填写必填项：项目名称、角色和描述")
      return
    }

    setIsLoading(true)

    try {
      // 创建项目
      const projectResponse = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (!projectResponse.ok) {
        throw new Error("创建项目失败")
      }

      const { project } = await projectResponse.json()

      // 生成AI卡片
      const aiResponse = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "generate-project-cards",
          data: {
            projectName: formData.name,
            role: formData.role,
            description: formData.description,
            techStack: formData.techStack,
            timeRange: formData.timeRange
          }
        })
      })

      if (aiResponse.ok) {
        const { data } = await aiResponse.json()
        
        // 批量创建卡片
        const cardPromises = data.cards.map((card: any) =>
          fetch(`/api/projects/${project.id}/cards`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              category: card.category,
              question: card.question,
              aiSuggestion: card.aiSuggestion,
              priority: card.priority
            })
          })
        )

        await Promise.all(cardPromises)
      }

      // 跳转到项目详情页
      router.push(`/projects/${project.id}`)
    } catch (error) {
      console.error("Failed to create project:", error)
      alert("创建项目失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <p className="text-gray-600">登录后即可创建项目</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/projects">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回项目列表
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">新建项目</h1>
          <p className="text-gray-600">创建项目并生成AI面试卡片</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>项目信息</CardTitle>
          <CardDescription>
            填写项目基本信息，AI将为您生成针对性的面试问题卡片
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 项目名称 */}
            <div className="space-y-2">
              <Label htmlFor="name">项目名称 *</Label>
              <Input
                id="name"
                placeholder="例如：电商平台重构项目"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            {/* 扮演角色 */}
            <div className="space-y-2">
              <Label htmlFor="role">扮演角色 *</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择您在项目中的角色" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 项目描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">项目描述 *</Label>
              <Textarea
                id="description"
                placeholder="请详细描述项目背景、主要功能、技术特点等（建议300字以内）"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                required
              />
              <p className="text-sm text-gray-500">
                {formData.description.length}/300 字
              </p>
            </div>

            {/* 时间段 */}
            <div className="space-y-2">
              <Label htmlFor="timeRange">所属时间段</Label>
              <Input
                id="timeRange"
                placeholder="例如：2023.03 - 2023.08"
                value={formData.timeRange}
                onChange={(e) => handleInputChange("timeRange", e.target.value)}
              />
            </div>

            {/* 技术栈 */}
            <div className="space-y-2">
              <Label htmlFor="techStack">关键技术栈</Label>
              <Input
                id="techStack"
                placeholder="例如：React, Node.js, MongoDB, Redis"
                value={formData.techStack}
                onChange={(e) => handleInputChange("techStack", e.target.value)}
              />
              <p className="text-sm text-gray-500">
                多个技术用逗号分隔
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    创建项目并生成卡片
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* AI Features Preview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            AI 将为您生成
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>项目背景问题</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>职责拆解问题</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>难点挑战问题</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>技术实现问题</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>协作沟通问题</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>反思优化问题</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            每个问题都会附带AI建议，告诉您从哪里可以找到相关信息来完善回答
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
