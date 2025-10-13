"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Sparkles, 
  Lightbulb,
  CheckCircle,
  Clock,
  FileText,
  Loader2
} from "lucide-react"
import Link from "next/link"

interface ProjectCard {
  id: string
  category: string
  question: string
  answer?: string
  aiSuggestion?: string
  status: string
  tags?: string
  priority: number
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
  role: string
  description: string
  timeRange?: string
  techStack?: string
  status: string
  createdAt: string
  updatedAt: string
  cards: ProjectCard[]
  documents: any[]
}

const CATEGORIES = [
  "项目背景",
  "职责拆解", 
  "难点挑战",
  "技术实现",
  "协作沟通",
  "反思与优化"
]

const STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "draft", label: "草稿" },
  { value: "answered", label: "已回答" },
  { value: "completed", label: "已完成" }
]

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [editingAnswer, setEditingAnswer] = useState("")
  const [isGeneratingCards, setIsGeneratingCards] = useState(false)
  const [isGettingSuggestion, setIsGettingSuggestion] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
      } else {
        router.push("/projects")
      }
    } catch (error) {
      console.error("Failed to fetch project:", error)
      router.push("/projects")
    } finally {
      setIsLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    if (session) {
      fetchProject()
    }
  }, [session, fetchProject])

  const handleGenerateCards = async () => {
    setIsGeneratingCards(true)
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "generate-project-cards",
          data: {
            projectName: project?.name,
            role: project?.role,
            description: project?.description,
            techStack: project?.techStack,
            timeRange: project?.timeRange
          }
        })
      })

      if (response.ok) {
        const { data } = await response.json()
        
        // 批量创建卡片
        const cardPromises = data.cards.map((card: any) =>
          fetch(`/api/projects/${params.id}/cards`, {
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
        await fetchProject() // 重新获取项目数据
      }
    } catch (error) {
      console.error("Failed to generate cards:", error)
      alert("生成卡片失败，请重试")
    } finally {
      setIsGeneratingCards(false)
    }
  }

  const handleGetSuggestion = async (card: ProjectCard) => {
    setIsGettingSuggestion(card.id)
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "get-card-suggestion",
          data: {
            projectName: project?.name,
            role: project?.role,
            category: card.category,
            question: card.question,
            currentAnswer: card.answer
          }
        })
      })

      if (response.ok) {
        const { data } = await response.json()
        
        // 更新卡片的AI建议
        await fetch(`/api/projects/${params.id}/cards/${card.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            aiSuggestion: data.suggestion
          })
        })

        await fetchProject() // 重新获取项目数据
      }
    } catch (error) {
      console.error("Failed to get suggestion:", error)
      alert("获取建议失败，请重试")
    } finally {
      setIsGettingSuggestion(null)
    }
  }

  const handleEditCard = (card: ProjectCard) => {
    setEditingCard(card.id)
    setEditingAnswer(card.answer || "")
  }

  const handleSaveAnswer = async (cardId: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/cards/${cardId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          answer: editingAnswer,
          status: editingAnswer.trim() ? "answered" : "draft"
        })
      })

      if (response.ok) {
        setEditingCard(null)
        setEditingAnswer("")
        await fetchProject()
      }
    } catch (error) {
      console.error("Failed to save answer:", error)
      alert("保存失败，请重试")
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("确定要删除这个卡片吗？")) return

    try {
      const response = await fetch(`/api/projects/${params.id}/cards/${cardId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        await fetchProject()
      }
    } catch (error) {
      console.error("Failed to delete card:", error)
      alert("删除失败，请重试")
    }
  }

  const filteredCards = project?.cards.filter(card => {
    const matchesSearch = card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.answer?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || card.category === categoryFilter
    const matchesStatus = statusFilter === "all" || card.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  }) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "answered":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft":
        return "草稿"
      case "answered":
        return "已回答"
      case "completed":
        return "已完成"
      default:
        return "未知"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Clock className="w-4 h-4" />
      case "answered":
        return <FileText className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <p className="text-gray-600">登录后即可查看项目</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">项目不存在</h1>
          <Button asChild>
            <Link href="/projects">返回项目列表</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/projects">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回项目列表
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{project.role}</Badge>
            {project.timeRange && (
              <span className="text-sm text-gray-600">{project.timeRange}</span>
            )}
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/projects/${project.id}/edit`}>
            <Edit className="w-4 h-4 mr-2" />
            编辑项目
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Description */}
          <Card>
            <CardHeader>
              <CardTitle>项目描述</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
              {project.techStack && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">技术栈</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.split(",").map((tech, index) => (
                      <Badge key={index} variant="outline">
                        {tech.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cards Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>面试卡片</CardTitle>
                {project.cards.length === 0 ? (
                  <Button
                    onClick={handleGenerateCards}
                    disabled={isGeneratingCards}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isGeneratingCards ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        生成卡片
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerateCards}
                    disabled={isGeneratingCards}
                    variant="outline"
                    size="sm"
                  >
                    {isGeneratingCards ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        新增卡片
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {project.cards.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有卡片</h3>
                  <p className="text-gray-600 mb-4">点击&ldquo;生成卡片&rdquo;让AI为您创建面试问题</p>
                  <Button
                    onClick={handleGenerateCards}
                    disabled={isGeneratingCards}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isGeneratingCards ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        生成卡片
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="搜索问题或回答..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="筛选分类" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部分类</SelectItem>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="筛选状态" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cards List */}
                  <div className="space-y-4">
                    {filteredCards.map((card) => (
                      <Card key={card.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{card.category}</Badge>
                                <Badge className={getStatusColor(card.status)}>
                                  {getStatusIcon(card.status)}
                                  <span className="ml-1">{getStatusText(card.status)}</span>
                                </Badge>
                                {card.priority >= 4 && (
                                  <Badge variant="destructive">高优先级</Badge>
                                )}
                              </div>
                              <h4 className="font-medium text-gray-900 mb-2">{card.question}</h4>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleGetSuggestion(card)}
                                disabled={isGettingSuggestion === card.id}
                              >
                                {isGettingSuggestion === card.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Lightbulb className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCard(card)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCard(card.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {editingCard === card.id ? (
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700">您的回答</label>
                                <Textarea
                                  value={editingAnswer}
                                  onChange={(e) => setEditingAnswer(e.target.value)}
                                  placeholder="在这里写下您的回答..."
                                  rows={4}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleSaveAnswer(card.id)}
                                  size="sm"
                                >
                                  保存
                                </Button>
                                <Button
                                  onClick={() => {
                                    setEditingCard(null)
                                    setEditingAnswer("")
                                  }}
                                  variant="outline"
                                  size="sm"
                                >
                                  取消
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {card.answer && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">您的回答</label>
                                  <p className="text-gray-700 whitespace-pre-wrap mt-1 p-3 bg-gray-50 rounded-md">
                                    {card.answer}
                                  </p>
                                </div>
                              )}
                              {card.aiSuggestion && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <Lightbulb className="w-4 h-4" />
                                    AI建议
                                  </label>
                                  <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-md mt-1">
                                    {card.aiSuggestion}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Stats */}
          <Card>
            <CardHeader>
              <CardTitle>项目统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">总卡片数</span>
                <span className="font-semibold">{project.cards.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">已完成</span>
                <span className="font-semibold text-green-600">
                  {project.cards.filter(c => c.status === "completed").length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">已回答</span>
                <span className="font-semibold text-blue-600">
                  {project.cards.filter(c => c.status === "answered").length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">草稿</span>
                <span className="font-semibold text-yellow-600">
                  {project.cards.filter(c => c.status === "draft").length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(project.cards.filter(c => c.status === "completed").length / Math.max(project.cards.length, 1)) * 100}%` 
                  }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleGenerateCards}
                disabled={isGeneratingCards}
                className="w-full"
                variant="outline"
              >
                {isGeneratingCards ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    生成新卡片
                  </>
                )}
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href={`/projects/${project.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  编辑项目信息
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
