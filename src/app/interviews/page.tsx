"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Search, Calendar, Building, MessageSquare, Mic } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

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
  const { data: session, status } = useSession()
  const [records, setRecords] = useState<InterviewRecord[]>([])
  const [_schedules, setSchedules] = useState<InterviewSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [hoveredEvent, setHoveredEvent] = useState<InterviewSchedule | null>(null)

  useEffect(() => {
    if (session) {
      fetchRecords()
      fetchSchedules()
    }
  }, [session])

  // 点击外部关闭hover卡片
  useEffect(() => {
    const handleClickOutside = (_event: MouseEvent) => {
      if (hoveredEvent) {
        setHoveredEvent(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [hoveredEvent])

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/interviews")
      if (response.ok) {
        const data = await response.json()
        setRecords(data)
      } else {
        console.error("Failed to fetch interview records:", response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch interview records:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/schedules")
      if (response.ok) {
        const data = await response.json()
        setSchedules(data)
      } else {
        console.error("Failed to fetch schedules:", response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error)
    }
  }

  const filteredRecords = records.filter(record => 
    record.schedule.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.schedule.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.transcript?.toLowerCase().includes(searchTerm.toLowerCase())
  )








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
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">面试复盘</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">管理您的面试复盘记录和岗位进度</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button asChild className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 flex-1 sm:flex-none">
            <Link href="/interviews/new">
              <Mic className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">新建面试复盘</span>
              <span className="sm:hidden">新建复盘</span>
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