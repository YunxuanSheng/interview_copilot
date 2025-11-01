"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Plus, Search, Code, Cpu, MessageSquare, Star } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface PersonalExperience {
  id: string
  company: string
  questionType: string
  questionText: string
  answerText?: string
  difficulty?: string
  tags?: string
  clusterId?: string
  createdAt: string
}

const questionTypes = [
  { value: "algorithm", label: "算法题", icon: Code, color: "text-blue-600" },
  { value: "system_design", label: "系统设计", icon: Cpu, color: "text-green-600" },
  { value: "behavioral", label: "行为面试", icon: MessageSquare, color: "text-purple-600" },
  { value: "technical", label: "技术问题", icon: Star, color: "text-orange-600" }
]

export default function ExperiencesPage() {
  const { data: session, status } = useSession()
  const [experiences, setExperiences] = useState<PersonalExperience[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState("all")

  useEffect(() => {
    if (session) {
      fetchExperiences()
    }
  }, [session])

  const fetchExperiences = async () => {
    try {
      const response = await fetch("/api/experiences")
      const data = await response.json()
      setExperiences(data)
    } catch (error) {
      console.error("Failed to fetch experiences:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredExperiences = experiences.filter(experience => {
    const matchesSearch = 
      experience.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      experience.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      experience.answerText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      experience.tags?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === "all" || experience.questionType === typeFilter
    const matchesDifficulty = difficultyFilter === "all" || experience.difficulty === difficultyFilter
    const matchesTag = tagFilter === "all" || experience.tags?.includes(tagFilter)
    
    return matchesSearch && matchesType && matchesDifficulty && matchesTag
  })

  const getQuestionTypeInfo = (type: string) => {
    return questionTypes.find(qt => qt.value === type) || questionTypes[0]
  }

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty) {
      case "easy":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">简单</Badge>
      case "medium":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">中等</Badge>
      case "hard":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">困难</Badge>
      default:
        return <Badge variant="outline">未分类</Badge>
    }
  }

  // 获取所有标签
  const allTags = Array.from(new Set(
    experiences
      .filter(e => e.tags)
      .flatMap(e => e.tags!.split(',').map(tag => tag.trim()))
      .filter(tag => tag.length > 0)
  ))

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
          <p className="text-gray-600 mb-6">登录后即可查看您的面经</p>
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">我的面经</h1>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">我的面经</h1>
          <p className="text-gray-600 mt-1">管理您的面试题目和经验</p>
        </div>
        <Button asChild>
          <Link href="/experiences/new">
            <Plus className="w-4 h-4 mr-2" />
            添加面经
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索公司、题目或答案..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有类型</option>
                {questionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有难度</option>
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有标签</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {filteredExperiences.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || typeFilter !== "all" || difficultyFilter !== "all" 
                ? "没有找到匹配的面经" 
                : "暂无面经记录"
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || typeFilter !== "all" || difficultyFilter !== "all"
                ? "尝试调整搜索条件或筛选器" 
                : "开始添加您的第一个面经记录"
              }
            </p>
            <Button asChild>
              <Link href="/experiences/new">
                <Plus className="w-4 h-4 mr-2" />
                添加面经
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">公司</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">题目类型</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">题目</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">答案</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">难度</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">标签</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">创建时间</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExperiences.map((experience) => {
                    const typeInfo = getQuestionTypeInfo(experience.questionType)
                    const Icon = typeInfo.icon
                    return (
                      <tr key={experience.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium">{experience.company}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${typeInfo.color}`} />
                            <span>{typeInfo.label}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-700 line-clamp-2 max-w-md">
                            {experience.questionText}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          {experience.answerText ? (
                            <p className="text-sm text-gray-600 line-clamp-2 max-w-md">
                              {experience.answerText}
                            </p>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getDifficultyBadge(experience.difficulty)}
                        </td>
                        <td className="py-3 px-4">
                          {experience.tags ? (
                            <div className="flex flex-wrap gap-1">
                              {experience.tags.split(',').map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag.trim()}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {format(new Date(experience.createdAt), "yyyy-MM-dd", { locale: zhCN })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/experiences/${experience.id}`}>
                              查看详情
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
