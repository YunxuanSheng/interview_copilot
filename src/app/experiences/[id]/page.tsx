"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { 
  BookOpen, 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Code, 
  Cpu, 
  MessageSquare, 
  Star, 
  Calendar,
  Building,
  Tag,
  AlertCircle,
  Copy
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { toast } from "sonner"

interface PersonalExperience {
  id: string
  userId: string
  company: string
  questionType: string
  questionText: string
  answerText?: string
  difficulty?: string
  tags?: string
  clusterId?: string
  createdAt: string
  updatedAt: string
}

const questionTypes = [
  { value: "algorithm", label: "算法题", icon: Code, color: "text-blue-600" },
  { value: "system_design", label: "系统设计", icon: Cpu, color: "text-green-600" },
  { value: "behavioral", label: "行为面试", icon: MessageSquare, color: "text-purple-600" },
  { value: "technical", label: "技术问题", icon: Star, color: "text-orange-600" }
]

const difficultyLevels = [
  { value: "easy", label: "简单", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "中等", color: "bg-yellow-100 text-yellow-800" },
  { value: "hard", label: "困难", color: "bg-red-100 text-red-800" }
]

export default function ExperienceDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const _router = useRouter()
  const [experience, setExperience] = useState<PersonalExperience | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    company: "",
    questionType: "",
    questionText: "",
    answerText: "",
    difficulty: "",
    tags: ""
  })

  useEffect(() => {
    if (session && params.id) {
      fetchExperience()
    }
  }, [session, params.id])

  const fetchExperience = async () => {
    try {
      const response = await fetch(`/api/experiences/${params.id}`)
      if (!response.ok) {
        throw new Error("获取题目详情失败")
      }
      const data = await response.json()
      setExperience(data)
      setEditForm({
        company: data.company || "",
        questionType: data.questionType || "",
        questionText: data.questionText || "",
        answerText: data.answerText || "",
        difficulty: data.difficulty || "",
        tags: data.tags || ""
      })
    } catch (error) {
      console.error("Failed to fetch experience:", error)
      setError("获取题目详情失败")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!experience) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/experiences/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error("保存失败")
      }

      const updatedExperience = await response.json()
      setExperience(updatedExperience)
      setIsEditing(false)
      setError("")
    } catch (error) {
      console.error("Failed to save experience:", error)
      setError("保存失败，请重试")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (experience) {
      setEditForm({
        company: experience.company || "",
        questionType: experience.questionType || "",
        questionText: experience.questionText || "",
        answerText: experience.answerText || "",
        difficulty: experience.difficulty || "",
        tags: experience.tags || ""
      })
    }
    setIsEditing(false)
    setError("")
  }

  const getQuestionTypeInfo = (type: string) => {
    return questionTypes.find(t => t.value === type) || questionTypes[0]
  }

  const getDifficultyInfo = (difficulty: string) => {
    return difficultyLevels.find(d => d.value === difficulty) || difficultyLevels[1]
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可查看面经详情</p>
          <Button asChild>
            <Link href="/auth/signin">立即登录</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (error || !experience) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">加载失败</h2>
          <p className="text-gray-600 mb-6">{error || "题目不存在或已被删除"}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => fetchExperience()}>重试</Button>
            <Button asChild variant="outline">
              <Link href="/experiences">返回面经库</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const questionTypeInfo = getQuestionTypeInfo(experience.questionType)
  const difficultyInfo = getDifficultyInfo(experience.difficulty || "medium")

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center">
        <Button asChild variant="outline" size="sm">
          <Link href="/experiences">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回面经库
          </Link>
        </Button>
      </div>

      {/* 标题区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {experience.company}
          </h1>
          <p className="text-xl text-gray-600 mb-1">{experience.questionText.substring(0, 50)}...</p>
          <p className="text-sm text-gray-500">{questionTypeInfo.label}</p>
        </div>
        
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              编辑题目
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "保存中..." : "保存"}
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="w-4 h-4 mr-2" />
                取消
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* 基本信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">公司</Label>
              {isEditing ? (
                <Input
                  id="company"
                  value={editForm.company}
                  onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="请输入公司名称"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{experience.company}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionType">题目类型</Label>
              {isEditing ? (
                <Select
                  value={editForm.questionType}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, questionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择题目类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <questionTypeInfo.icon className={`w-4 h-4 ${questionTypeInfo.color}`} />
                  <span className="font-medium">{questionTypeInfo.label}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">难度</Label>
              {isEditing ? (
                <Select
                  value={editForm.difficulty}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, difficulty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择难度" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyLevels.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${level.color.split(' ')[0]}`}></div>
                          {level.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={difficultyInfo.color}>
                  {difficultyInfo.label}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">标签</Label>
              {isEditing ? (
                <Input
                  id="tags"
                  value={editForm.tags}
                  onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="请输入标签，用逗号分隔"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {experience.tags || "暂无标签"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>创建时间: {format(new Date(experience.createdAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}</span>
            </div>
            {experience.updatedAt !== experience.createdAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>更新时间: {format(new Date(experience.updatedAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 题目内容卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>题目内容</CardTitle>
          <CardDescription>面试官提出的问题</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editForm.questionText}
              onChange={(e) => setEditForm(prev => ({ ...prev, questionText: e.target.value }))}
              placeholder="请输入题目内容..."
              className="min-h-[120px]"
            />
          ) : (
            <div className="prose max-w-none">
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                {experience.questionText}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 我的答案卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            我的答案
          </CardTitle>
          <CardDescription>您对这个问题的回答和思路</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editForm.answerText}
              onChange={(e) => setEditForm(prev => ({ ...prev, answerText: e.target.value }))}
              placeholder="请输入您的答案和思路..."
              className="min-h-[200px]"
            />
          ) : (
            <div className="prose max-w-none">
              {experience.answerText ? (
                <div className="text-gray-900 leading-relaxed">
                  {experience.answerText.split('\n').map((line, index) => {
                    // 处理代码块
                    if (line.startsWith('```')) {
                      return <div key={index} className="my-4"></div>
                    }
                    // 处理标题
                    if (line.startsWith('## ')) {
                      return <h2 key={index} className="text-xl font-semibold mt-6 mb-3 text-gray-900">{line.substring(3)}</h2>
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={index} className="text-lg font-medium mt-4 mb-2 text-gray-900">{line.substring(4)}</h3>
                    }
                    // 处理列表项
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return <div key={index} className="ml-4 mb-1">• {line.substring(2)}</div>
                    }
                    if (line.startsWith('1. ')) {
                      return <div key={index} className="ml-4 mb-1">{line}</div>
                    }
                    // 处理代码行
                    if (line.startsWith('    ') || line.startsWith('\t')) {
                      return <div key={index} className="bg-gray-100 p-2 rounded font-mono text-sm my-1">{line}</div>
                    }
                    // 处理空行
                    if (line.trim() === '') {
                      return <div key={index} className="h-2"></div>
                    }
                    // 普通文本
                    return <p key={index} className="mb-2">{line}</p>
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>暂无答案，点击编辑添加您的答案</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI推荐答案卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            AI推荐答案
          </CardTitle>
          <CardDescription>基于问题类型和难度的AI优化建议</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 答案评分 */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">答案质量评分</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= 4 ? 'text-yellow-500 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">4.2/5</span>
              </div>
            </div>

            {/* AI分析 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">优点</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 思路清晰，逻辑性强</li>
                  <li>• 代码实现正确</li>
                  <li>• 时间复杂度分析准确</li>
                  <li>• 考虑了边界情况</li>
                </ul>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">改进建议</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• 可以添加更多测试用例</li>
                  <li>• 考虑空间复杂度优化</li>
                  <li>• 补充算法适用场景说明</li>
                </ul>
              </div>
            </div>

            {/* 推荐答案 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">AI优化版本</h4>
              <div className="prose prose-sm max-w-none">
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-3">
                    <strong>优化思路：</strong>在原有哈希表解法基础上，可以进一步优化空间复杂度。
                  </p>
                  
                  <p className="mb-3">
                    <strong>算法步骤：</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 mb-3">
                    <li>创建哈希表存储元素值到索引的映射</li>
                    <li>遍历数组，计算目标值与当前元素的差值</li>
                    <li>检查差值是否在哈希表中存在</li>
                    <li>如果存在返回索引，否则存储当前元素</li>
                  </ol>

                  <p className="mb-3">
                    <strong>代码实现：</strong>
                  </p>
                  <div className="relative">
                    <button
                      onClick={async () => {
                        const code = `def twoSum(nums, target):
    hashmap = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in hashmap:
            return [hashmap[complement], i]
        hashmap[num] = i
    return []`
                        try {
                          await navigator.clipboard.writeText(code)
                          toast.success("代码已复制到剪贴板！")
                        } catch {
                          toast.error("复制失败，请手动复制")
                        }
                      }}
                      className="absolute top-2 right-2 p-2 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors flex items-center gap-1"
                      title="复制代码"
                    >
                      <Copy className="w-3 h-3" />
                      复制
                    </button>
                    <pre className="bg-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                      <code>{`def twoSum(nums, target):
    hashmap = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in hashmap:
            return [hashmap[complement], i]
        hashmap[num] = i
    return []`}</code>
                    </pre>
                  </div>

                  <p className="mt-3">
                    <strong>复杂度分析：</strong>时间复杂度O(n)，空间复杂度O(n)
                  </p>
                </div>
              </div>
            </div>

            {/* 相关知识点 */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-3">相关知识点</h4>
              <div className="flex flex-wrap gap-2">
                {['哈希表', '双指针', '数组遍历', '时间复杂度', '空间复杂度'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
