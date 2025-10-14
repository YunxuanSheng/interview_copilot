"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, FileText, BookOpen, TrendingUp, Clock, CheckCircle, Mail, Mic, CalendarDays, Users, ExternalLink, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import Link from "next/link"
import { addDays, format, isSameDay } from "date-fns"
// @ts-expect-error - react-big-calendar types are not fully compatible
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// 设置moment本地化
moment.locale('zh-cn')
const localizer = momentLocalizer(moment)

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
  const [hoveredEvent, setHoveredEvent] = useState<InterviewSchedule | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const [isHoveringCard, setIsHoveringCard] = useState(false)

  useEffect(() => {
    if (session) {
      fetchDashboardData()
      fetchSchedules()
    }
  }, [session])

  // 点击外部关闭hover卡片
  useEffect(() => {
    const handleClickOutside = (_event: MouseEvent) => {
      if (hoveredEvent && !isHoveringCard) {
        setHoveredEvent(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [hoveredEvent, isHoveringCard])

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

  // 日历事件数据
  const calendarEvents = schedules.map(schedule => {
    const interviewDate = new Date(schedule.interviewDate)
    // 设置为同一天的开始和结束，避免跨天显示
    const startOfDay = new Date(interviewDate)
    startOfDay.setHours(9, 0, 0, 0) // 上午9点开始
    
    const endOfDay = new Date(interviewDate)
    endOfDay.setHours(18, 0, 0, 0) // 下午6点结束
    
    return {
      id: schedule.id,
      title: `${schedule.company} - ${schedule.position}`,
      start: startOfDay,
      end: endOfDay,
      resource: schedule
    }
  })

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

  const eventStyleGetter = (event: {
    resource?: InterviewSchedule
  }) => {
    const status = event.resource?.status
    let backgroundColor = '#3174ad'
    
    switch (status) {
      case "completed":
        backgroundColor = '#28a745'
        break
      case "cancelled":
        backgroundColor = '#dc3545'
        break
      case "scheduled":
        backgroundColor = '#007bff'
        break
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  const handleNavigate = (date: Date) => {
    setCurrentDate(date)
  }

  // 自定义事件组件
  const EventComponent = ({ event }: { event: {
    id: string
    title: string
    start: Date
    end: Date
    resource: InterviewSchedule
  } }) => {
    const handleMouseEnter = (e: React.MouseEvent, eventData: { resource: InterviewSchedule }) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const cardWidth = 300
      const cardHeight = 200
      
      // 计算最佳位置，避免超出视窗
      let x = rect.left + rect.width / 2
      let y = rect.bottom + 10  // 默认显示在下方
      
      // 水平位置调整
      if (x + cardWidth / 2 > viewportWidth) {
        x = viewportWidth - cardWidth / 2 - 10
      }
      if (x - cardWidth / 2 < 10) {
        x = cardWidth / 2 + 10
      }
      
      // 垂直位置调整 - 优先显示在下方，如果下方空间不够再显示在上方
      if (y + cardHeight > viewportHeight - 10) {
        y = rect.top - cardHeight - 10  // 显示在上方
        if (y < 10) {
          y = 10  // 确保不超出视窗顶部
        }
      }
      
      setHoverPosition({ x, y })
      setHoveredEvent(eventData.resource)
    }

    const handleMouseLeave = () => {
      // 延迟关闭，给用户时间移动到卡片上
      setTimeout(() => {
        if (!isHoveringCard) {
          setHoveredEvent(null)
        }
      }, 100)
    }

    return (
      <div
        onMouseEnter={(e) => handleMouseEnter(e, { resource: event.resource })}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full cursor-pointer"
      >
        <div className="text-xs truncate px-1">
          {event.title}
        </div>
      </div>
    )
  }

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
          今天有 {stats?.upcomingInterviews || 0} 场面试安排，继续加油！
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
            <div className="h-[500px]">
              <BigCalendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                view="month"
                date={currentDate}
                onNavigate={handleNavigate}
                eventPropGetter={eventStyleGetter}
                components={{
                  event: EventComponent
                }}
                onSelectEvent={(_event: {
                  id: string
                  title: string
                  start: Date
                  end: Date
                  resource: InterviewSchedule
                }) => {
                  // 可以添加点击事件的处理
                }}
                messages={{
                  next: 'Next',
                  previous: 'Previous',
                  today: 'Today',
                  month: 'Month',
                  week: 'Week',
                  day: 'Day',
                  agenda: 'Agenda',
                  date: 'Date',
                  time: 'Time',
                  event: 'Event',
                  noEventsInRange: 'No events in this range',
                  showMore: (total: number) => `+${total} more`
                }}
              />
            </div>
            
            {/* Hover卡片 */}
            {hoveredEvent && (
              <div
                className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[300px] max-w-[400px]"
                style={{
                  left: `${hoverPosition.x}px`,
                  top: `${hoverPosition.y}px`,
                  transform: 'translateX(-50%)'
                }}
                onMouseEnter={() => setIsHoveringCard(true)}
                onMouseLeave={() => setIsHoveringCard(false)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {hoveredEvent.company}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {hoveredEvent.position}
                      </p>
                      {hoveredEvent.department && (
                        <p className="text-xs text-gray-500">
                          {hoveredEvent.department}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(hoveredEvent.status)}
                      <button
                        onClick={() => setHoveredEvent(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-500" />
                      <span>
                        {format(new Date(hoveredEvent.interviewDate), "yyyy年MM月dd日 HH:mm")}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>第{hoveredEvent.round}轮面试</span>
                    </div>
                    
                    {hoveredEvent.interviewLink && (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                        <a 
                          href={hoveredEvent.interviewLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline text-xs"
                        >
                          进入面试
                        </a>
                      </div>
                    )}
                    
                    {hoveredEvent.tags && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">标签:</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {hoveredEvent.tags}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/schedules/${hoveredEvent.id}`}>
                        查看详情
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/schedules/${hoveredEvent.id}/edit`}>
                        编辑
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
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
