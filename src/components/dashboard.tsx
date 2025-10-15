"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, FileText, BookOpen, TrendingUp, Clock, CheckCircle, Mail, Mic, CalendarDays, Users, ExternalLink, X } from "lucide-react"
// 首页采用与 /schedules 一致的简化月历网格，不再使用 ui/calendar 封装
import Link from "next/link"
import { addDays, format, isSameDay } from "date-fns"
import { zhCN } from "date-fns/locale"

// 采用 date-fns 的 zhCN 本地化

interface DashboardStats {
  totalSchedules: number
  completedInterviews: number
  totalExperiences: number
  upcomingInterviews: number
  totalProjects: number
}

interface UpcomingInterview {
  id: string
  company: string
  position: string
  interviewDate: string
  round: number
}

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
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalSchedules: 0,
    completedInterviews: 0,
    totalExperiences: 0,
    upcomingInterviews: 0,
    totalProjects: 0
  })
  const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([])
  const [allInterviews, setAllInterviews] = useState<UpcomingInterview[]>([])
  const [recentExperiences, setRecentExperiences] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [schedules, setSchedules] = useState<InterviewSchedule[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  // 简化月历采用基于格子的悬浮详情，仅用 CSS group 控制显示
  
  // 计算今天的面试数量
  const todaySchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.interviewDate)
    const today = new Date()
    return scheduleDate.toDateString() === today.toDateString() && schedule.status === "scheduled"
  }).length

  useEffect(() => {
    if (session) {
      fetchDashboardData()
      fetchSchedules()
    }
  }, [session])

  // 简化月历无全局 hover 卡片关闭逻辑

  // 轮播图自动播放
  useEffect(() => {
    if (recentExperiences.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % recentExperiences.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [recentExperiences.length])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard")
      const data = await response.json()
      
      // 确保 stats 对象存在且包含所有必要的属性
      if (data.stats) {
        setStats({
          totalSchedules: data.stats.totalSchedules || 0,
          completedInterviews: data.stats.completedInterviews || 0,
          totalExperiences: data.stats.totalExperiences || 0,
          upcomingInterviews: data.stats.upcomingInterviews || 0,
          totalProjects: data.stats.totalProjects || 0
        })
      }
      
      setUpcomingInterviews(data.upcomingInterviews || [])
      setAllInterviews(data.allInterviews || [])
      setRecentExperiences(data.recentExperiences || [])
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      // 在错误情况下，确保 stats 保持初始状态
      setStats({
        totalSchedules: 0,
        completedInterviews: 0,
        totalExperiences: 0,
        upcomingInterviews: 0,
        totalProjects: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/schedules")
      const data = await response.json()
      setSchedules(data)
    } catch (error) {
      console.error("Failed to fetch schedules:", error)
    }
  }

  // 简化月历不再需要 react-big-calendar 的事件映射

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">待开始</Badge>
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">已完成</Badge>
      case "cancelled":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">已取消</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 移除 react-big-calendar 相关逻辑与组件

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-2xl">AI</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">AI面试助理</h1>
            <p className="text-xl text-gray-600 mb-8">
              基于AI的智能面试管理平台，帮助您高效管理面试进度和记录面经
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">面试日程管理</h3>
              <p className="text-sm text-gray-600">智能管理面试安排，支持日历视图</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">面试记录复盘</h3>
              <p className="text-sm text-gray-600">AI分析面试表现，生成改进建议</p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">我的面经</h3>
              <p className="text-sm text-gray-600">建立个人面试经验数据库</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <Button asChild size="lg" className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="/auth/signin">🚀 一键进入Demo</Link>
            </Button>
            <p className="text-sm text-gray-500">
              Demo模式无需注册，直接体验所有功能
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          欢迎回来，{session.user?.name || "用户"}！
        </h1>
        <p className="text-blue-100">
          {todaySchedules > 0 ? (
            <>今天有 {todaySchedules} 场面试安排，继续加油！</>
          ) : (
            <>今天没有面试安排，是时候准备新的机会了！</>
          )}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 面试统计卡片 */}
        <Link href="/schedules">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">面试统计</CardTitle>
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats?.totalSchedules || 0}</div>
                  <p className="text-sm text-muted-foreground">总面试</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats?.completedInterviews || 0}</div>
                  <p className="text-sm text-muted-foreground">已完成</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{(stats?.totalSchedules || 0) - (stats?.completedInterviews || 0)}</div>
                  <p className="text-sm text-muted-foreground">待完成</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 内容统计卡片 */}
        <Link href="/experiences">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">内容统计</CardTitle>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats?.totalExperiences || 0}</div>
                  <p className="text-sm text-muted-foreground">面经题目</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">{stats?.totalProjects || 0}</div>
                  <p className="text-sm text-muted-foreground">整理项目</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Calendar and Upcoming Interviews */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 日历 */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                面试日历
              </CardTitle>
              <CardDescription>查看面试安排</CardDescription>
            </div>
            <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="/schedules/new">
                <CalendarIcon className="mr-2 h-4 w-4" />
                添加日程
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 relative">
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
                            {daySchedules.slice(0, 2).map((schedule) => (
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
                                          
                                          <Button asChild variant="outline" size="sm" className="flex-1">
                                            <Link href={`/schedules/${schedule.id}/edit`}>
                                              编辑
                                            </Link>
                                          </Button>
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

            <div className="flex justify-center mt-4">
              <Button asChild variant="outline" size="sm" className="bg-white/80 hover:bg-white shadow-sm">
                <Link href="/schedules">查看完整日历</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 即将到来的面试 */}
        <Card>
          <CardHeader>
            <CardTitle>即将到来的面试</CardTitle>
            <CardDescription>最近的面试安排</CardDescription>
          </CardHeader>
          <CardContent>
            {!upcomingInterviews || upcomingInterviews.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无即将到来的面试</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/schedules/new">添加面试安排</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium">{interview.company}</p>
                      <p className="text-sm text-gray-600">{interview.position}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(interview.interviewDate).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      第{interview.round}轮
                    </Badge>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/schedules">查看所有安排</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 最近整理的面经轮播图 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>最近整理的面经</CardTitle>
            <CardDescription>最新添加的面试经验题目</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/experiences">
              <BookOpen className="mr-2 h-4 w-4" />
              查看全部
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentExperiences.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">暂无面经题目</p>
              <p className="text-sm mb-4">开始整理你的面试经验吧！</p>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link href="/experiences/new">添加面经题目</Link>
              </Button>
            </div>
          ) : (
            <div className="relative">
              {/* 轮播容器 */}
              <div className="overflow-hidden rounded-lg">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {recentExperiences.map((experience, index) => (
                    <div key={experience.id} className="w-full flex-shrink-0">
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{experience.questionText}</h3>
                              <p className="text-sm text-gray-600">{experience.company}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-white/80">
                            {experience.difficulty || "中等"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">题目描述：</h4>
                            <p className="text-sm text-gray-600 line-clamp-3">{experience.questionText}</p>
                          </div>
                          
                          {experience.answerText && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">解题思路：</h4>
                              <p className="text-sm text-gray-600 line-clamp-2">{experience.answerText}</p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>添加时间：{new Date(experience.createdAt).toLocaleDateString('zh-CN')}</span>
                            <span>{experience.tags?.join(', ') || '无标签'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 轮播指示器 */}
              {recentExperiences.length > 1 && (
                <div className="flex justify-center space-x-2 mt-4">
                  {recentExperiences.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentSlide 
                          ? 'bg-blue-500 w-8' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
