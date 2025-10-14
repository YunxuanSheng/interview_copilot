"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Search, Calendar, Building, MessageSquare, Mic, Clock, Users, CalendarDays, ExternalLink, X } from "lucide-react"
import Link from "next/link"
import { format, addDays, isToday, isTomorrow, isYesterday } from "date-fns"
import { zhCN } from "date-fns/locale"
// @ts-expect-error - react-big-calendar types are not fully compatible
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// 设置moment本地化
moment.locale('zh-cn')
const localizer = momentLocalizer(moment)

interface InterviewRecord {
  id: string
  scheduleId: string
  audioFilePath?: string
  transcript?: string
  aiAnalysis?: string
  feedback?: string
  createdAt: string
  schedule: {
    company: string
    position: string
    interviewDate: string
    round: number
  }
  questions: {
    id: string
    questionText: string
    userAnswer?: string
    aiEvaluation?: string
    questionType?: string
  }[]
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

export default function InterviewsPage() {
  const { data: session } = useSession()
  const [records, setRecords] = useState<InterviewRecord[]>([])
  const [schedules, setSchedules] = useState<InterviewSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [hoveredEvent, setHoveredEvent] = useState<InterviewSchedule | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const [isHoveringCard, setIsHoveringCard] = useState(false)

  useEffect(() => {
    if (session) {
      fetchRecords()
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

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/interviews")
      const data = await response.json()
      setRecords(data)
    } catch (error) {
      console.error("Failed to fetch interview records:", error)
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

  const filteredRecords = records.filter(record => 
    record.schedule.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.schedule.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.transcript?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    return records.some(record => record.scheduleId === scheduleId)
  }

  // 获取面试复盘记录
  const getInterviewRecord = (scheduleId: string) => {
    return records.find(record => record.scheduleId === scheduleId)
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

  // 按公司分组，每个公司包含多个岗位
  const groupedByCompany = filteredRecords.reduce((acc, record) => {
    const company = record.schedule.company
    const position = record.schedule.position
    
    if (!acc[company]) {
      acc[company] = {
        company,
        positions: new Map(),
        totalRecords: 0,
        totalQuestions: 0,
        totalRounds: 0,
        passedRounds: 0,
        firstInterviewDate: null,
        lastInterviewDate: null,
        averageScore: 0
      }
    }
    
    // 按岗位分组
    if (!acc[company].positions.has(position)) {
      acc[company].positions.set(position, {
        position,
        records: [],
        totalRounds: 0,
        completedRounds: 0,
        passedRounds: 0,
        totalQuestions: 0,
        averageScore: 0,
        firstInterviewDate: null,
        lastInterviewDate: null,
        roundDetails: new Map<number, InterviewRecord[]>()
      })
    }
    
    const positionData = acc[company].positions.get(position)!
    positionData.records.push(record)
    acc[company].totalRecords++
    acc[company].totalQuestions += record.questions.length
    
    // 更新轮次信息
    const round = record.schedule.round
    if (!positionData.roundDetails.has(round)) {
      positionData.roundDetails.set(round, [])
    }
    positionData.roundDetails.get(round)!.push(record)
    
    // 更新总轮次
    positionData.totalRounds = Math.max(positionData.totalRounds, round)
    acc[company].totalRounds = Math.max(acc[company].totalRounds, round)
    
    // 更新日期信息
    const interviewDate = new Date(record.schedule.interviewDate)
    if (!positionData.firstInterviewDate || interviewDate < positionData.firstInterviewDate) {
      positionData.firstInterviewDate = interviewDate
    }
    if (!positionData.lastInterviewDate || interviewDate > positionData.lastInterviewDate) {
      positionData.lastInterviewDate = interviewDate
    }
    if (!acc[company].firstInterviewDate || interviewDate < acc[company].firstInterviewDate) {
      acc[company].firstInterviewDate = interviewDate
    }
    if (!acc[company].lastInterviewDate || interviewDate > acc[company].lastInterviewDate) {
      acc[company].lastInterviewDate = interviewDate
    }
    
    // 计算平均分数
    if (record.aiAnalysis) {
      const scoreMatch = record.aiAnalysis.match(/(\d+)\/10|(\d+)分|评分[：:]\s*(\d+)/)
      if (scoreMatch) {
        const score = parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3])
        if (!isNaN(score)) {
          positionData.averageScore = (positionData.averageScore * positionData.records.length + score) / (positionData.records.length + 1)
        }
      }
    }
    
    positionData.totalQuestions += record.questions.length
    
    return acc
  }, {} as Record<string, {
    company: string
    positions: Map<string, {
      position: string
      records: InterviewRecord[]
      totalRounds: number
      completedRounds: number
      passedRounds: number
      totalQuestions: number
      averageScore: number
      firstInterviewDate: Date | null
      lastInterviewDate: Date | null
      roundDetails: Map<number, InterviewRecord[]>
    }>
    totalRecords: number
    totalQuestions: number
    totalRounds: number
    passedRounds: number
    firstInterviewDate: Date | null
    lastInterviewDate: Date | null
    averageScore: number
  }>)

  // 计算每个岗位和公司的完成轮次和通过轮次
  Object.values(groupedByCompany).forEach(company => {
    let companyPassedRounds = 0
    let companyTotalScore = 0
    let companyScoreCount = 0
    
    company.positions.forEach(position => {
      position.completedRounds = position.roundDetails.size
      // 简化通过轮次计算：假设有AI分析且包含正面评价的轮次为通过
      position.passedRounds = Array.from(position.roundDetails.values()).filter(roundRecords => 
        roundRecords.some(record => 
          record.aiAnalysis && 
          (record.aiAnalysis.includes('通过') || 
           record.aiAnalysis.includes('优秀') || 
           record.aiAnalysis.includes('良好'))
        )
      ).length
      
      companyPassedRounds += position.passedRounds
      if (position.averageScore > 0) {
        companyTotalScore += position.averageScore
        companyScoreCount++
      }
    })
    
    company.passedRounds = companyPassedRounds
    company.averageScore = companyScoreCount > 0 ? companyTotalScore / companyScoreCount : 0
  })



  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可查看面试复盘记录</p>
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
          <h1 className="text-3xl font-bold text-gray-900">面试复盘</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">面试复盘</h1>
          <p className="text-gray-600 mt-1">管理您的面试复盘记录和岗位进度</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
            <Link href="/interviews/new">
              <Mic className="w-4 h-4 mr-2" />
              新建面试复盘
            </Link>
          </Button>
        </div>
      </div>

      {/* 数据看板 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-600">复盘记录</p>
              <p className="text-lg font-bold text-gray-900">{records.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-600">复盘问题</p>
              <p className="text-lg font-bold text-gray-900">
                {records.reduce((sum, r) => sum + r.questions.length, 0)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-600">复盘公司</p>
              <p className="text-lg font-bold text-gray-900">
                {new Set(records.map(r => r.schedule.company)).size}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜索公司、职位或面试内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      {Object.keys(groupedByCompany).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "没有找到匹配的面试复盘记录" : "暂无面试复盘记录"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? "尝试调整搜索条件" 
                : "开始记录您的第一次面试复盘"
              }
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                <Link href="/interviews/new">
                  <Mic className="w-4 h-4 mr-2" />
                  新建面试复盘
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>面试复盘记录</CardTitle>
            <CardDescription>您的面试复盘历史记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">公司</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">职位</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">轮次</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">面试日期</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">问题数量</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">整体表现</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(groupedByCompany).map((company) => 
                    Array.from(company.positions.values()).map((position) =>
                      position.records.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{company.company}</div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary" className="text-xs">
                              {position.position}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-xs">
                              第{record.schedule.round}轮
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(record.schedule.interviewDate), "MM月dd日", { locale: zhCN })}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MessageSquare className="w-4 h-4" />
                              {record.questions.length} 个问题
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-600 max-w-xs truncate">
                              {record.feedback || record.aiAnalysis || "暂无评价"}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/interviews/${record.id}`}>
                                  查看
                                </Link>
                              </Button>
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/interviews/${record.id}/edit`}>
                                  编辑
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}