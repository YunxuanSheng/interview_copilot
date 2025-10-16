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
  Building, 
  Calendar, 
  Edit, 
  Save, 
  X, 
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface WorkExperience {
  id: string
  userId: string
  company: string
  position: string
  startDate: string
  endDate?: string
  description?: string
  achievements?: string
  createdAt: string
  updatedAt: string
  cards: WorkExperienceCard[]
}

interface WorkExperienceCard {
  id: string
  workExperienceId: string
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

const CATEGORIES = [
  "工作职责",
  "项目经验", 
  "技术挑战",
  "团队协作",
  "业务成果",
  "学习成长"
]

const STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "draft", label: "草稿" },
  { value: "answered", label: "已回答" },
  { value: "completed", label: "已完成" }
]

export default function WorkExperienceDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [workExperience, setWorkExperience] = useState<WorkExperience | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [editingAnswer, setEditingAnswer] = useState("")
  const [isGeneratingCards, setIsGeneratingCards] = useState(false)
  const [isGettingSuggestion, setIsGettingSuggestion] = useState<string | null>(null)

  const fetchWorkExperience = useCallback(async () => {
    try {
      const response = await fetch(`/api/work-experiences/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setWorkExperience(data.workExperience)
      } else {
        router.push("/profile")
      }
    } catch (error) {
      console.error("Failed to fetch work experience:", error)
      router.push("/profile")
    } finally {
      setIsLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    if (session) {
      fetchWorkExperience()
    }
  }, [session, fetchWorkExperience])

  const handleGenerateCards = async () => {
    if (!workExperience) return

    setIsGeneratingCards(true)
    try {
      const response = await fetch(`/api/work-experiences/${params.id}/cards/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company: workExperience.company,
          position: workExperience.position,
          description: workExperience.description,
          achievements: workExperience.achievements
        }),
      })

      if (response.ok) {
        toast.success("AI已生成工作经历卡片")
        fetchWorkExperience()
      } else {
        toast.error("生成卡片失败")
      }
    } catch (error) {
      console.error("Generate cards error:", error)
      toast.error("生成卡片失败")
    } finally {
      setIsGeneratingCards(false)
    }
  }

  const handleGetSuggestion = async (cardId: string) => {
    setIsGettingSuggestion(cardId)
    try {
      const response = await fetch(`/api/work-experiences/${params.id}/cards/${cardId}/suggestion`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        // 更新卡片建议
        if (workExperience) {
          setWorkExperience(prev => ({
            ...prev!,
            cards: prev!.cards.map(card => 
              card.id === cardId 
                ? { ...card, aiSuggestion: data.suggestion }
                : card
            )
          }))
        }
        toast.success("AI建议已生成")
      } else {
        toast.error("获取建议失败")
      }
    } catch (error) {
      console.error("Get suggestion error:", error)
      toast.error("获取建议失败")
    } finally {
      setIsGettingSuggestion(null)
    }
  }

  const handleUpdateCard = async (cardId: string, field: string, value: string) => {
    try {
      const response = await fetch(`/api/work-experiences/${params.id}/cards/${cardId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: value }),
      })

      if (response.ok) {
        fetchWorkExperience()
      } else {
        toast.error("更新失败")
      }
    } catch (error) {
      console.error("Update card error:", error)
      toast.error("更新失败")
    }
  }

  const handleStartEdit = (cardId: string, currentAnswer: string) => {
    setEditingCard(cardId)
    setEditingAnswer(currentAnswer || "")
  }

  const handleSaveEdit = (cardId: string) => {
    handleUpdateCard(cardId, "answer", editingAnswer)
    handleUpdateCard(cardId, "status", editingAnswer ? "answered" : "draft")
    setEditingCard(null)
    setEditingAnswer("")
  }

  const handleCancelEdit = () => {
    setEditingCard(null)
    setEditingAnswer("")
  }

  const filteredCards = workExperience?.cards.filter(card => {
    const matchesSearch = 
      card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.tags?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === "all" || card.category === categoryFilter
    const matchesStatus = statusFilter === "all" || card.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  }) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "answered": return "bg-blue-100 text-blue-800"
      case "draft": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4" />
      case "answered": return <Clock className="w-4 h-4" />
      case "draft": return <AlertCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "已完成"
      case "answered": return "已回答"
      case "draft": return "草稿"
      default: return "草稿"
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!workExperience) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">工作经历不存在</h2>
          <Button asChild>
            <Link href="/profile">返回个人档案</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{workExperience.company}</h1>
          <p className="text-gray-600 mt-1">{workExperience.position}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Experience Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                工作描述
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{workExperience.description}</p>
              {workExperience.achievements && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">主要成就</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{workExperience.achievements}</p>
                </div>
              )}
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(workExperience.startDate).toLocaleDateString()} - 
                    {workExperience.endDate ? new Date(workExperience.endDate).toLocaleDateString() : "至今"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>工作经历拆分</CardTitle>
                <Button 
                  onClick={handleGenerateCards}
                  disabled={isGeneratingCards}
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGeneratingCards ? "生成中..." : "AI生成卡片"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <Input
                  placeholder="搜索问题..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cards List */}
              <div className="space-y-4">
                {filteredCards.map((card) => (
                  <Card key={card.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{card.category}</Badge>
                            <Badge className={getStatusColor(card.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(card.status)}
                                {getStatusText(card.status)}
                              </span>
                            </Badge>
                            <Badge variant="secondary">优先级 {card.priority}</Badge>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2">{card.question}</h4>
                        </div>
                      </div>

                      {editingCard === card.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editingAnswer}
                            onChange={(e) => setEditingAnswer(e.target.value)}
                            placeholder="输入您的回答..."
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveEdit(card.id)}>
                              <Save className="w-4 h-4 mr-1" />
                              保存
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="w-4 h-4 mr-1" />
                              取消
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {card.answer ? (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-gray-700 whitespace-pre-wrap">{card.answer}</p>
                            </div>
                          ) : (
                            <div className="text-gray-500 italic">暂无回答</div>
                          )}

                          {card.aiSuggestion && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <h5 className="font-medium text-blue-900 mb-1">AI建议</h5>
                              <p className="text-blue-800 text-sm whitespace-pre-wrap">{card.aiSuggestion}</p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEdit(card.id, card.answer || "")}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              编辑回答
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGetSuggestion(card.id)}
                              disabled={isGettingSuggestion === card.id}
                            >
                              <Sparkles className="w-4 h-4 mr-1" />
                              {isGettingSuggestion === card.id ? "生成中..." : "AI建议"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {filteredCards.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无工作经历卡片</p>
                    <p className="text-sm">点击&ldquo;AI生成卡片&rdquo;开始拆分工作经历</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>统计信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">总卡片数</span>
                  <span className="font-medium">{workExperience.cards.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">已完成</span>
                  <span className="font-medium text-green-600">
                    {workExperience.cards.filter(c => c.status === "completed").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">已回答</span>
                  <span className="font-medium text-blue-600">
                    {workExperience.cards.filter(c => c.status === "answered").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">草稿</span>
                  <span className="font-medium text-gray-600">
                    {workExperience.cards.filter(c => c.status === "draft").length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
