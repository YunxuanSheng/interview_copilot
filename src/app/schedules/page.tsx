"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, Search, Clock, Users, Mail, CalendarDays, List, ArrowUpDown, ExternalLink, X } from "lucide-react"
import Link from "next/link"
import { format, addDays, isToday, isTomorrow, isYesterday, startOfDay } from "date-fns"
import { zhCN } from "date-fns/locale"
// @ts-expect-error - react-big-calendar types are not fully compatible
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// 设置moment本地化
moment.locale('zh-cn')
const localizer = momentLocalizer(moment)

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

export default function SchedulesPage() {
  const { data: session } = useSession()
  const [schedules, setSchedules] = useState<InterviewSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("asc")
  const [, setSelectedDate] = useState(new Date())
  const [currentDate, setCurrentDate] = useState(new Date())
  const [hoveredEvent, setHoveredEvent] = useState<InterviewSchedule | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const [interviewRecords, setInterviewRecords] = useState<Array<{
    scheduleId: string
    id: string
  }>>([])
  const [isHoveringCard, setIsHoveringCard] = useState(false)

  useEffect(() => {
    if (session) {
      fetchSchedules()
      fetchInterviewRecords()
    }
  }, [session])

  // 点击外部关闭hover卡片
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hoveredEvent && !isHoveringCard) {
        setHoveredEvent(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [hoveredEvent, isHoveringCard])

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/schedules")
      const data = await response.json()
      setSchedules(data)
    } catch (error) {
      console.error("Failed to fetch schedules:", error)
    } finally {
      setIsLoading(false)
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

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = 
      schedule.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.department?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || schedule.status === statusFilter
    
    return matchesSearch && matchesStatus
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

  // 最近三天面试
  const recentSchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.interviewDate)
    const today = new Date()
    const threeDaysAgo = addDays(today, -3)
    const threeDaysLater = addDays(today, 3)
    
    return scheduleDate >= threeDaysAgo && scheduleDate <= threeDaysLater
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
  const upcomingSchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.interviewDate)
    const today = startOfDay(new Date())
    return scheduleDate >= today && schedule.status === "scheduled"
  }).sort((a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime())

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
        return <Badge variant="default" className="bg-blue-100 text-blue-800">已安排</Badge>
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">已完成</Badge>
      case "cancelled":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">已取消</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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
    const handleMouseEnter = (e: React.MouseEvent) => {
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
      setHoveredEvent(event.resource)
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
        onMouseEnter={handleMouseEnter}
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">面试日程</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">面试日程</h1>
          <p className="text-gray-600 mt-1">管理您的所有面试安排</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link href="/schedules/parse-email">
              <Mail className="w-4 h-4 mr-2" />
              智能添加日程
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/schedules/new">
              <Plus className="w-4 h-4 mr-2" />
              手动添加
            </Link>
          </Button>
        </div>
      </div>

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
              <div className="h-[600px]">
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
                  onSelectEvent={(event: {
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
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>
                          {format(new Date(hoveredEvent.interviewDate), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
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
                      {hoveredEvent.status === "completed" ? (
                        hasReviewed(hoveredEvent.id) ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/interviews/${getInterviewRecord(hoveredEvent.id)?.id}`}>
                              查看复盘
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/interviews/new?scheduleId=${hoveredEvent.id}`}>
                              去复盘
                            </Link>
                          </Button>
                        )
                      ) : (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/schedules/${hoveredEvent.id}/edit`}>
                            编辑
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：最近三天面试（窄） */}
        <div className="w-full lg:w-80">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                最近三天
              </CardTitle>
              <CardDescription>
                即将到来的面试
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 overflow-y-auto">
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
                  <SelectItem value="scheduled">已安排</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
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
                <Link href="/schedules/parse-email">
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
                    <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
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

    </div>
  )
}