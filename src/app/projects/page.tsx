"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Filter, 
  FolderOpen, 
  FileText, 
  Clock, 
  CheckCircle,
  Edit,
  Trash2,
  Sparkles
} from "lucide-react"
import Link from "next/link"

interface Project {
  id: string
  name: string
  role: string
  company?: string
  department?: string
  workType?: string
  description: string
  timeRange?: string
  techStack?: string
  status: string
  createdAt: string
  updatedAt: string
  cards: Array<{
    id: string
    category: string
    status: string
    priority: number
  }>
  _count: {
    cards: number
    documents: number
  }
}

export default function ProjectsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (session) {
      fetchProjects()
    }
  }, [session])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("确定要删除这个项目吗？")) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setProjects(projects.filter(p => p.id !== projectId))
      } else {
        alert("删除失败，请重试")
      }
    } catch (error) {
      console.error("Failed to delete project:", error)
      alert("删除失败，请重试")
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "进行中"
      case "archived":
        return "已归档"
      default:
        return "未知"
    }
  }

  const getCardStatusCount = (cards: Project["cards"]) => {
    const answered = cards.filter(card => card.status === "answered").length
    const completed = cards.filter(card => card.status === "completed").length
    const draft = cards.filter(card => card.status === "draft").length
    return { answered, completed, draft, total: cards.length }
  }

  const formatCompanyInfo = (project: Project) => {
    const parts = []
    if (project.company) parts.push(project.company)
    if (project.department) parts.push(project.department)
    if (project.workType) parts.push(project.workType)
    return parts.length > 0 ? parts.join('-') : null
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <p className="text-gray-600">登录后即可管理您的项目</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">项目整理</h1>
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="flex items-center gap-6 mx-6">
                    <div className="h-8 bg-gray-200 rounded w-12"></div>
                    <div className="h-8 bg-gray-200 rounded w-12"></div>
                    <div className="h-8 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-8"></div>
                    <div className="h-8 bg-gray-200 rounded w-8"></div>
                  </div>
                </div>
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
          <h1 className="text-3xl font-bold text-gray-900">项目整理</h1>
          <p className="text-gray-600 mt-1">管理您的项目语料库，为面试做准备</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Link href="/projects/new">
            <Plus className="w-4 h-4 mr-2" />
            新建项目
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索项目名称或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">进行中</SelectItem>
            <SelectItem value="archived">已归档</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== "all" ? "没有找到匹配的项目" : "还没有项目"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "all" 
                ? "尝试调整搜索条件或筛选器" 
                : "创建您的第一个项目，开始整理面试语料"
              }
            </p>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="/projects/new">
                <Plus className="w-4 h-4 mr-2" />
                新建项目
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const cardStats = getCardStatusCount(project.cards)
            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* 左侧：项目基本信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {project.name}
                        </h3>
                        <Badge variant="secondary" className="shrink-0">
                          {project.role}
                        </Badge>
                        {formatCompanyInfo(project) && (
                          <Badge variant="outline" className="shrink-0 bg-blue-50 text-blue-700 border-blue-200">
                            {formatCompanyInfo(project)}
                          </Badge>
                        )}
                        <Badge className={`shrink-0 ${getStatusColor(project.status)}`}>
                          {getStatusText(project.status)}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {project.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        {/* 时间范围 */}
                        {project.timeRange && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{project.timeRange}</span>
                          </div>
                        )}
                      </div>

                      {/* 技术栈标签 */}
                      {project.techStack && (
                        <div className="flex flex-wrap gap-1">
                          {project.techStack.split(",").map((tech, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tech.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 右侧：操作按钮 */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        asChild
                        size="sm"
                        variant={cardStats.total === 0 ? "default" : "outline"}
                      >
                        <Link href={`/projects/${project.id}`}>
                          {cardStats.total === 0 ? (
                            <>
                              <Sparkles className="w-4 h-4 mr-1" />
                              生成卡片
                            </>
                          ) : (
                            "查看项目"
                          )}
                        </Link>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 底部：进度信息与进度条（移动到下方，给描述让位） */}
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-semibold text-gray-900">{cardStats.total}</span>
                        <span className="text-xs">总卡片</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-semibold text-green-600">{cardStats.completed}</span>
                        <span className="text-xs">已完成</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-semibold text-blue-600">{Math.round((cardStats.completed / Math.max(cardStats.total, 1)) * 100)}%</span>
                        <span className="text-xs">完成率</span>
                      </div>
                    </div>
                    {cardStats.total > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(cardStats.completed / Math.max(cardStats.total, 1)) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
