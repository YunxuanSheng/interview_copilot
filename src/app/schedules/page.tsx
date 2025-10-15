"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, Plus, Search, Clock, Mail, CalendarDays, List, ArrowUpDown, ExternalLink, Trash2, Briefcase, Edit, MapPin, DollarSign, User } from "lucide-react"
import Link from "next/link"
import { format, addDays, isToday, isTomorrow, isYesterday } from "date-fns"
import { zhCN } from "date-fns/locale"
import { toast } from "sonner"
// 简化的日历组件，不需要复杂的视图切换

interface InterviewSchedule {
  id: string
  company: string
  position: string
  department?: string
  interviewDate: string
  interviewLink?: string
  round: number
  tags?: string
  notes?: string
  status: string
  createdAt: string
  jobApplicationId?: string
}

interface JobApplication {
  id: string
  company: string
  position: string
  department?: string
  status: string
  priority: string
  appliedDate: string
  jobUrl?: string
  jobDescription?: string
  isReferral: boolean
  referrerName?: string
  salary?: string
  location?: string
  notes?: string
  createdAt: string
  schedules?: InterviewSchedule[]
}

const statusOptions = [
  { value: "applied", label: "已投递", color: "bg-blue-100 text-blue-800" },
  { value: "screening", label: "筛选中", color: "bg-yellow-100 text-yellow-800" },
  { value: "interview", label: "面试中", color: "bg-purple-100 text-purple-800" },
  { value: "offer", label: "已发offer", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "已拒绝", color: "bg-red-100 text-red-800" },
  { value: "withdrawn", label: "已撤回", color: "bg-gray-100 text-gray-800" }
]

const priorityOptions = [
  { value: "low", label: "低", color: "bg-gray-100 text-gray-800" },
  { value: "medium", label: "中", color: "bg-blue-100 text-blue-800" },
  { value: "high", label: "高", color: "bg-orange-100 text-orange-800" },
  { value: "urgent", label: "紧急", color: "bg-red-100 text-red-800" }
]



export default function SchedulesPage() {
  const { data: session, status } = useSession()
  const [schedules, setSchedules] = useState<InterviewSchedule[]>([])
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("asc")
  const [_selectedDate, _setSelectedDate] = useState<Date | null>(null)
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [interviewRecords, setInterviewRecords] = useState<Array<{
    scheduleId: string
    id: string
  }>>([])
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // 工作申请相关状态
  const [jobApplicationSearchTerm, setJobApplicationSearchTerm] = useState("")
  const [jobApplicationStatusFilter, setJobApplicationStatusFilter] = useState("all")
  const [jobApplicationPriorityFilter, setJobApplicationPriorityFilter] = useState("all")
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // 初始化日期（避免hydration mismatch）
  useEffect(() => {
    setCurrentDate(new Date())
    _setSelectedDate(new Date())
  }, [])

  // 点击外部关闭hover窗口
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.group\\/schedule')) {
        // setHoveredDate(null) // 已删除hoveredDate状态
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchSchedules()
      fetchJobApplications()
      fetchInterviewRecords()
    }
  }, [session])

  // 简化的日历组件不需要hover功能

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/schedules")
      const data = await response.json()
      
      // 检查并更新过期的面试状态
      const updatedSchedules = data.map((schedule: InterviewSchedule) => {
        const scheduleDate = new Date(schedule.interviewDate)
        const now = new Date()
        
        // 如果面试时间已过且状态为scheduled，则自动更新为completed
        if (scheduleDate < now && schedule.status === "scheduled") {
          return { ...schedule, status: "completed" }
        }
        
        return schedule
      })
      
      setSchedules(updatedSchedules)
      
      // 如果有状态更新，同步到服务器
      const hasUpdates = updatedSchedules.some((schedule: InterviewSchedule, index: number) => 
        schedule.status !== data[index].status
      )
      
      if (hasUpdates) {
        // 批量更新过期的面试状态
        const expiredSchedules = updatedSchedules.filter((schedule: InterviewSchedule, index: number) => 
          schedule.status !== data[index].status
        )
        
        for (const schedule of expiredSchedules) {
          try {
            await fetch(`/api/schedules/${schedule.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "completed" })
            })
          } catch (error) {
            console.error("Failed to update expired schedule:", error)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchJobApplications = async () => {
    try {
      const response = await fetch("/api/job-applications")
      if (!response.ok) {
        throw new Error("Failed to fetch job applications")
      }
      const data = await response.json()
      setJobApplications(data)
    } catch (error) {
      console.error("Failed to fetch job applications:", error)
      setJobApplications([])
    }
  }

  const fetchInterviewRecords = async () => {
    try {
      const response = await fetch("/api/interviews")
      const data = await response.json()
      setInterviewRecords(data)
    } catch (error) {
      console.error("Failed to fetch interview records:", error)
    }
  }

  // 工作申请相关函数 - 暂时注释掉，等待API重构
  const handleDeleteApplication = async (_id: string) => {
    toast.error("功能暂时不可用，等待API重构")
  }

  const handleEditApplication = (application: JobApplication) => {
    setEditingApplication(application)
    setIsEditDialogOpen(true)
  }

  const handleUpdateApplication = async (_formData: FormData) => {
    toast.error("功能暂时不可用，等待API重构")
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // 从列表中移除已删除的面试安排
        setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId))
        setDeleteConfirmId(null)
        toast.success("面试安排删除成功")
      } else {
        toast.error("删除失败，请重试")
      }
    } catch (error) {
      console.error("删除面试安排时出错:", error)
      toast.error("删除失败，请重试")
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = 
      schedule.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.department?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || schedule.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // 工作申请筛选逻辑
  const filteredJobApplications = jobApplications.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(jobApplicationSearchTerm.toLowerCase()) ||
                         app.position.toLowerCase().includes(jobApplicationSearchTerm.toLowerCase())
    const matchesStatus = jobApplicationStatusFilter === "all" || app.status === jobApplicationStatusFilter
    const matchesPriority = jobApplicationPriorityFilter === "all" || app.priority === jobApplicationPriorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  // 排序逻辑
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case "date":
        comparison = new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime()
        break
      case "company":
        comparison = a.company.localeCompare(b.company)
        break
      case "round":
        comparison = a.round - b.round
        break
      default:
        comparison = 0
    }
    
    return sortOrder === "asc" ? comparison : -comparison
  })

  // 最近三天面试（只显示今天和未来的面试）
  const recentSchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.interviewDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // 设置为今天的开始时间
    const threeDaysLater = addDays(today, 3)
    
    return scheduleDate >= today && scheduleDate <= threeDaysLater
  }).sort((a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime())

  // 按日期分组最近三天
  const groupedRecentSchedules = recentSchedules.reduce((acc, schedule) => {
    const date = format(new Date(schedule.interviewDate), "yyyy-MM-dd")
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(schedule)
    return acc
  }, {} as Record<string, InterviewSchedule[]>)

  // 即将到来的面试（今天及以后）
  // const upcomingSchedules = schedules.filter(schedule => {
  //   const scheduleDate = new Date(schedule.interviewDate)
  //   const today = startOfDay(new Date())
  //   return scheduleDate >= today && schedule.status === "scheduled"
  // }).sort((a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime())

  // 简化的日历数据 - 不再需要复杂的事件映射

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">待开始</Badge>
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">已结束</Badge>
      case "cancelled":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">已取消</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }


  const getReviewStatusBadge = (scheduleId: string) => {
    if (hasReviewed(scheduleId)) {
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800">已复盘</Badge>
    } else {
      return <Badge variant="outline" className="bg-gray-100 text-gray-600">未复盘</Badge>
    }
  }

  const getDateLabel = (date: string) => {
    const scheduleDate = new Date(date)
    if (isToday(scheduleDate)) return "今天"
    if (isTomorrow(scheduleDate)) return "明天"
    if (isYesterday(scheduleDate)) return "昨天"
    return format(scheduleDate, "MM月dd日", { locale: zhCN })
  }

  const getTimeLabel = (date: string) => {
    return format(new Date(date), "HH:mm", { locale: zhCN })
  }

  // 检查面试是否已复盘
  const hasReviewed = (scheduleId: string) => {
    return interviewRecords.some(record => record.scheduleId === scheduleId)
  }

  // 获取面试复盘记录
  const getInterviewRecord = (scheduleId: string) => {
    return interviewRecords.find(record => record.scheduleId === scheduleId)
  }

  // 简化的日历组件 - 不再需要复杂的事件处理

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
          <p className="text-gray-600 mb-6">登录后即可管理您的面试日程</p>
          <Button asChild>
            <Link href="/auth/signin">立即登录</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading || !currentDate) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">面试进度管理</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">面试进度管理</h1>
          <p className="text-gray-600 mt-1">管理您的投递岗位和面试安排</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link href="/schedules/add">
              <Plus className="w-4 h-4 mr-2" />
              添加日程
            </Link>
          </Button>
        </div>
      </div>

      {/* 我的投递卡片 - 完整功能版本 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                我的投递
              </CardTitle>
              <CardDescription>
                管理您的岗位投递进度
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/schedules/job-application/new">
                <Plus className="w-4 h-4 mr-2" />
                新建投递
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 筛选器 */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索公司或职位..."
                  value={jobApplicationSearchTerm}
                  onChange={(e) => setJobApplicationSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={jobApplicationStatusFilter} onValueChange={setJobApplicationStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={jobApplicationPriorityFilter} onValueChange={setJobApplicationPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="优先级筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部优先级</SelectItem>
                {priorityOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 岗位投递列表 */}
          <div className="grid gap-4">
            {filteredJobApplications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Calendar className="w-12 h-12" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">暂无岗位投递</h3>
                  <p className="text-gray-500 mb-4">开始创建您的第一个岗位投递吧</p>
                  <Button asChild variant="outline">
                    <Link href="/schedules/job-application/new">
                      <Plus className="w-4 h-4 mr-2" />
                      新建投递
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredJobApplications.map((application) => {
                const statusOption = statusOptions.find(opt => opt.value === application.status)
                const priorityOption = priorityOptions.find(opt => opt.value === application.priority)
                
                return (
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{application.position}</CardTitle>
                          <CardDescription className="text-lg font-medium text-gray-900">
                            {application.company}
                            {application.department && ` · ${application.department}`}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={statusOption?.color}>
                            {statusOption?.label}
                          </Badge>
                          <Badge className={priorityOption?.color}>
                            {priorityOption?.label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {application.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {application.location}
                          </div>
                        )}
                        {application.salary && (
                          <div className="flex items-center text-sm text-gray-600">
                            <DollarSign className="w-4 h-4 mr-2" />
                            {application.salary}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(application.appliedDate).toLocaleDateString()}
                        </div>
                        {application.isReferral && (
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="w-4 h-4 mr-2" />
                            内推{application.referrerName && ` (${application.referrerName})`}
                          </div>
                        )}
                      </div>
                      
                      {application.jobDescription && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {application.jobDescription}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          {application.jobUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(application.jobUrl, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              查看职位
                            </Button>
                          )}
                          {application.schedules && application.schedules.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = `/schedules?jobApplication=${application.id}`}
                            >
                              查看面试 ({application.schedules.length})
                            </Button>
                          )}
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/schedules/add?jobApplicationId=${application.id}`}>
                              安排面试
                            </Link>
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditApplication(application)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteApplication(application.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* 第一行：日历 + 最近三天 */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 左侧：面试日历（宽） */}
        <div className="flex-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                面试日历
              </CardTitle>
              <CardDescription>
                查看您的面试安排时间分布
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 relative">
              {/* 简化的日历组件 */}
              <div className="space-y-4">
                {/* 日历头部 - 月份导航 */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {currentDate && format(currentDate, "yyyy年MM月", { locale: zhCN })}
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(currentDate || new Date())
                        newDate.setMonth(newDate.getMonth() - 1)
                        setCurrentDate(newDate)
                      }}
                    >
                      ←
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(currentDate || new Date())
                        newDate.setMonth(newDate.getMonth() + 1)
                        setCurrentDate(newDate)
                      }}
                    >
                      →
                    </Button>
                  </div>
                </div>

                {/* 完整的月份日历网格 */}
                <div className="grid grid-cols-7 gap-1">
                  {/* 星期标题 */}
                  {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                  
                  {/* 日历日期 */}
                  {(() => {
                    const currentMonth = currentDate || new Date()
                    const year = currentMonth.getFullYear()
                    const month = currentMonth.getMonth()
                    
                    // 获取当月第一天和最后一天
                    const firstDay = new Date(year, month, 1)
                    const lastDay = new Date(year, month + 1, 0)
                    const daysInMonth = lastDay.getDate()
                    
                    // 获取第一天是星期几（0=周日）
                    const firstDayOfWeek = firstDay.getDay()
                    
                    // 生成日历网格
                    const calendarDays = []
                    
                    // 添加空白日期（上个月的日期）
                    for (let i = 0; i < firstDayOfWeek; i++) {
                      calendarDays.push(
                        <div key={`empty-${i}`} className="p-2 h-20"></div>
                      )
                    }
                    
                    // 添加当月日期
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day)
                      const daySchedules = schedules.filter(schedule => {
                        const scheduleDate = new Date(schedule.interviewDate)
                        return scheduleDate.getFullYear() === year && 
                               scheduleDate.getMonth() === month && 
                               scheduleDate.getDate() === day
                      })
                      
                      const isToday = date.toDateString() === new Date().toDateString()
                      
                      calendarDays.push(
                        <div
                          key={day}
                          className={`relative p-2 h-20 border border-gray-200 group ${
                            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex flex-col h-full">
                            <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                              {day}
                            </div>
                            <div className="flex-1 flex flex-col gap-1 mt-1">
                              {daySchedules.slice(0, 2).map((schedule, _index) => (
                                <div
                                  key={schedule.id}
                                  className="relative group/schedule"
                                >
                                  <div
                                    className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer transition-colors ${
                                      schedule.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                      schedule.status === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                      'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                    }`}
                                    onClick={() => {
                                      // 可以添加点击事件
                                    }}
                                  >
                                    {schedule.company}
                                  </div>
                                  
                                  {/* 单个面试项目的hover详情 */}
                                  <div className="absolute z-30 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 group-hover/schedule:opacity-100 transition-all duration-300 pointer-events-none group-hover/schedule:pointer-events-auto transform translate-y-1 group-hover/schedule:translate-y-0 min-w-80">
                                    <div className="p-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="text-sm font-semibold text-gray-900">
                                          {schedule.company}
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            // setHoveredDate(null) // 已删除hoveredDate状态
                                          }}
                                          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                                        >
                                          ×
                                        </button>
                                      </div>
                                      
                                      <div className="space-y-3">
                                        <div className="border-l-3 border-blue-400 pl-3 py-2">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="font-medium text-base text-gray-900">
                                              {schedule.position}
                                            </div>
                                            <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                              {format(new Date(schedule.interviewDate), 'HH:mm', { locale: zhCN })}
                                            </div>
                                          </div>
                                          
                                          <div className="text-sm text-gray-700 mb-2">
                                            {format(new Date(schedule.interviewDate), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                                          </div>
                                          
                                          <div className="flex items-center gap-2 text-sm mb-2">
                                            <span className="text-gray-500">第{schedule.round}轮</span>
                                            <span className="text-gray-300">·</span>
                                            {getStatusBadge(schedule.status)}
                                          </div>
                                          
                                          {schedule.department && (
                                            <div className="text-sm text-gray-500 mb-2">
                                              部门：{schedule.department}
                                            </div>
                                          )}
                                          
                                          {schedule.notes && (
                                            <div className="text-sm text-gray-600 mb-3 p-2 bg-gray-50 rounded">
                                              {schedule.notes}
                                            </div>
                                          )}
                                          
                                          <div className="flex gap-2">
                                            <Button asChild size="sm" className="flex-1">
                                              <Link href={`/schedules/${schedule.id}`}>
                                                查看详情
                                              </Link>
                                            </Button>
                                            
                                            {schedule.interviewLink && (
                                              <Button asChild variant="outline" size="sm" className="flex-1">
                                                <a href={schedule.interviewLink} target="_blank" rel="noopener noreferrer">
                                                  进入面试
                                                </a>
                                              </Button>
                                            )}
                                            
                                            {schedule.status === "completed" && (
                                              <Button asChild variant="outline" size="sm" className="flex-1">
                                                <Link href={hasReviewed(schedule.id) ? `/interviews/${getInterviewRecord(schedule.id)?.id}` : `/interviews/new?scheduleId=${schedule.id}`}>
                                                  {hasReviewed(schedule.id) ? '查看复盘' : '去复盘'}
                                                </Link>
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {daySchedules.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{daySchedules.length - 2}个
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    }
                    
                    return calendarDays
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：最近三天面试（窄） */}
        <div className="w-full lg:w-96">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                即将到来的面试
              </CardTitle>
              <CardDescription>
                今天和未来三天的面试安排
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
              {Object.keys(groupedRecentSchedules).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">暂无近期面试</p>
                </div>
              ) : (
                Object.entries(groupedRecentSchedules)
                  .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                  .map(([date, daySchedules]) => (
                    <div key={date} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{getDateLabel(date)}</h4>
                        <Badge variant="outline" className="text-xs">
                          {daySchedules.length}
                        </Badge>
                      </div>
                      
                      {daySchedules.map((schedule) => (
                        <div key={schedule.id} className="p-3 bg-gray-50 rounded border hover:bg-gray-100 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h5 className="font-medium text-sm">{schedule.company}</h5>
                              <p className="text-xs text-gray-600">{schedule.position}</p>
                            </div>
                            {getStatusBadge(schedule.status)}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{getTimeLabel(schedule.interviewDate)}</span>
                            <span>·</span>
                            <span>第{schedule.round}轮</span>
                          </div>
                          
                          <div className="flex gap-1 mt-2">
                            <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                              <Link href={`/schedules/${schedule.id}`}>
                                详情
                              </Link>
                            </Button>
                            {schedule.status === "completed" ? (
                              hasReviewed(schedule.id) ? (
                                <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                                  <Link href={`/interviews/${getInterviewRecord(schedule.id)?.id}`}>
                                    复盘
                                  </Link>
                                </Button>
                              ) : (
                                <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                                  <Link href={`/interviews/new?scheduleId=${schedule.id}`}>
                                    复盘
                                  </Link>
                                </Button>
                              )
                            ) : schedule.interviewLink ? (
                              <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                                <a href={schedule.interviewLink} target="_blank" rel="noopener noreferrer">
                                  进入
                                </a>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 底部：表格视图 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <List className="w-5 h-5" />
                面试安排列表
              </CardTitle>
              <CardDescription>
                所有面试安排的详细列表
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有状态</SelectItem>
                  <SelectItem value="scheduled">待面试</SelectItem>
                  <SelectItem value="completed">已结束</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="排序" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">按日期</SelectItem>
                  <SelectItem value="company">按公司</SelectItem>
                  <SelectItem value="round">按轮次</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3"
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索栏 */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索公司、职位或部门..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* 表格内容 */}
          {sortedSchedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== "all" ? "没有找到匹配的面试安排" : "暂无面试安排"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== "all" 
                  ? "尝试调整搜索条件或筛选器" 
                  : "开始添加您的第一个面试安排"
                }
              </p>
              <Button asChild>
                <Link href="/schedules/add">
                  <Mail className="w-4 h-4 mr-2" />
                  智能添加日程
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">公司</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">职位</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">面试时间</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">轮次</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">面试状态</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">复盘状态</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSchedules.map((schedule) => (
                    <tr key={schedule.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium">{schedule.company}</div>
                        {schedule.department && (
                          <div className="text-sm text-gray-500">{schedule.department}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{schedule.position}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">
                          {format(new Date(schedule.interviewDate), "MM月dd日", { locale: zhCN })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(schedule.interviewDate), "HH:mm", { locale: zhCN })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">第{schedule.round}轮</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(schedule.status)}
                      </td>
                      <td className="py-3 px-4">
                        {getReviewStatusBadge(schedule.id)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/schedules/${schedule.id}`}>
                              详情
                            </Link>
                          </Button>
                          {schedule.status === "completed" ? (
                            hasReviewed(schedule.id) ? (
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/interviews/${getInterviewRecord(schedule.id)?.id}`}>
                                  查看复盘
                                </Link>
                              </Button>
                            ) : (
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/interviews/new?scheduleId=${schedule.id}`}>
                                  去复盘
                                </Link>
                              </Button>
                            )
                          ) : (
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/schedules/${schedule.id}/edit`}>
                                编辑
                              </Link>
                            </Button>
                          )}
                          {schedule.interviewLink && (
                            <Button asChild variant="outline" size="sm">
                              <a href={schedule.interviewLink} target="_blank" rel="noopener noreferrer">
                                进入
                              </a>
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setDeleteConfirmId(schedule.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑工作申请对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑岗位投递</DialogTitle>
            <DialogDescription>
              更新岗位投递信息
            </DialogDescription>
          </DialogHeader>
          {editingApplication && (
            <form action={handleUpdateApplication} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">公司名称 *</Label>
                  <Input
                    id="company"
                    name="company"
                    defaultValue={editingApplication.company}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="position">职位名称 *</Label>
                  <Input
                    id="position"
                    name="position"
                    defaultValue={editingApplication.position}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">部门</Label>
                  <Input
                    id="department"
                    name="department"
                    defaultValue={editingApplication.department || ""}
                  />
                </div>
                <div>
                  <Label htmlFor="location">工作地点</Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={editingApplication.location || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">状态</Label>
                  <Select name="status" defaultValue={editingApplication.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">优先级</Label>
                  <Select name="priority" defaultValue={editingApplication.priority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="jobUrl">职位链接</Label>
                <Input
                  id="jobUrl"
                  name="jobUrl"
                  type="url"
                  defaultValue={editingApplication.jobUrl || ""}
                />
              </div>

              <div>
                <Label htmlFor="salary">薪资范围</Label>
                <Input
                  id="salary"
                  name="salary"
                  defaultValue={editingApplication.salary || ""}
                />
              </div>

              <div>
                <Label htmlFor="jobDescription">工作介绍</Label>
                <Textarea
                  id="jobDescription"
                  name="jobDescription"
                  defaultValue={editingApplication.jobDescription || ""}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isReferral"
                  name="isReferral"
                  defaultChecked={editingApplication.isReferral}
                  className="rounded"
                />
                <Label htmlFor="isReferral">内推</Label>
              </div>

              <div>
                <Label htmlFor="referrerName">内推人姓名</Label>
                <Input
                  id="referrerName"
                  name="referrerName"
                  defaultValue={editingApplication.referrerName || ""}
                />
              </div>

              <div>
                <Label htmlFor="notes">备注</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={editingApplication.notes || ""}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  取消
                </Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">确认删除</h3>
                <p className="text-sm text-gray-600">此操作无法撤销</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              您确定要删除这个面试安排吗？删除后将无法恢复。
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteSchedule(deleteConfirmId)}
                disabled={isDeleting}
              >
                {isDeleting ? "删除中..." : "确认删除"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}