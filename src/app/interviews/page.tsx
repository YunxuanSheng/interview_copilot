"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Search, Calendar, Building, MessageSquare, Mic, Share2, Loader2, CheckCircle, Clock, AlertCircle, Sparkles, Filter, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { toast } from "sonner"

interface InterviewRecord {
  id: string
  scheduleId: string
  audioFilePath?: string
  transcript?: string
  aiAnalysis?: string
  feedback?: string
  createdAt: string
  company: string
  position: string
  interviewDate: string
  round: number
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

interface TranscriptionTask {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  audioFileName: string
  audioFileSize: number
  estimatedDuration: number
  actualDuration: number | null
  transcript: string | null
  error: string | null
  createdAt: string
  completedAt: string | null
}

interface CombinedItem {
  id: string
  type: 'record' | 'task'
  company?: string
  position?: string
  round?: number
  interviewDate?: string
  questions?: any[]
  transcript?: string | null
  aiAnalysis?: string | null
  status: '语音转换中' | '转换完成' | '复盘完成' | '转换失败'
  taskStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  audioFileName?: string
  createdAt: string
  completedAt?: string | null
  taskId?: string
}

export default function InterviewsPage() {
  const { data: session, status } = useSession()
  const [records, setRecords] = useState<InterviewRecord[]>([])
  const [tasks, setTasks] = useState<TranscriptionTask[]>([])
  const [schedules, setSchedules] = useState<InterviewSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [hoveredEvent, setHoveredEvent] = useState<InterviewSchedule | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<CombinedItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (session) {
      fetchRecords()
      fetchSchedules()
      fetchTasks()
      
      // 轮询刷新任务列表（每30秒）
      const interval = setInterval(() => {
        fetchTasks()
        fetchRecords()
      }, 30000)
      
      return () => clearInterval(interval)
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
        const result = await response.json()
        if (result.success && result.data) {
          setRecords(result.data)
        } else {
          console.error("Failed to fetch interview records: Invalid response format")
          setRecords([])
        }
      } else {
        console.error("Failed to fetch interview records:", response.statusText)
        setRecords([])
      }
    } catch (error) {
      console.error("Failed to fetch interview records:", error)
      setRecords([])
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

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks/transcription")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setTasks(result.data)
        }
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    setIsDeleting(true)
    try {
      if (itemToDelete.type === 'task') {
        // 删除转录任务
        const response = await fetch(`/api/tasks/transcription/${itemToDelete.taskId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          toast.success('任务已删除')
          // 刷新列表
          fetchTasks()
        } else {
          const result = await response.json()
          toast.error(result.message || '删除失败')
        }
      } else {
        // 删除面试记录
        const response = await fetch(`/api/interviews/${itemToDelete.id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          toast.success('面试记录已删除')
          // 刷新列表
          fetchRecords()
        } else {
          const result = await response.json()
          toast.error(result.message || result.error || '删除失败')
        }
      }
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败，请稍后重试')
    } finally {
      setIsDeleting(false)
    }
  }

  // 合并面试记录和转录任务
  const getCombinedItems = (): CombinedItem[] => {
    const items: CombinedItem[] = []
    
    // 添加面试记录
    records.forEach(record => {
      const status: '语音转换中' | '转换完成' | '复盘完成' | '转换失败' = 
        record.aiAnalysis ? '复盘完成' : 
        record.transcript ? '转换完成' : 
        '语音转换中'
      
      items.push({
        id: record.id,
        type: 'record',
        company: record.company,
        position: record.position,
        round: record.round,
        interviewDate: record.interviewDate,
        questions: record.questions,
        transcript: record.transcript,
        aiAnalysis: record.aiAnalysis,
        status,
        createdAt: record.createdAt
      })
    })
    
    // 添加转录任务（尝试匹配到已有记录或schedule）
    tasks.forEach(task => {
      // 尝试通过transcript匹配到已有记录
      let matchedRecord: InterviewRecord | null = null
      if (task.transcript) {
        matchedRecord = records.find(record => {
          // 精确匹配
          if (record.transcript === task.transcript) return true
          // 或者transcript包含task的transcript的关键部分（去掉空格和换行比较）
          const recordClean = record.transcript?.replace(/\s+/g, '')
          const taskClean = task.transcript.replace(/\s+/g, '')
          if (recordClean && taskClean) {
            // 如果相似度超过80%（取较短的一方作为基准）
            const minLength = Math.min(recordClean.length, taskClean.length)
            const maxLength = Math.max(recordClean.length, taskClean.length)
            if (minLength > 50 && maxLength > 0) {
              // 简单的相似度检查：检查是否有大量重叠
              const overlapLength = Math.min(
                recordClean.substring(0, minLength) === taskClean.substring(0, minLength) ? minLength : 0,
                recordClean.substring(recordClean.length - minLength) === taskClean.substring(taskClean.length - minLength) ? minLength : 0
              )
              if (overlapLength / minLength > 0.7) return true
            }
          }
          return false
        }) || null
      }
      
      // 如果没有匹配的记录，或者匹配的记录还没有transcript，则添加任务项
      // 但已经创建了记录的转录任务不应该再显示（避免重复）
      if (!matchedRecord || !matchedRecord.transcript) {
        const status: '语音转换中' | '转换完成' | '复盘完成' | '转换失败' = 
          task.status === 'failed' ? '转换失败' :
          task.status === 'completed' ? '转换完成' :
          task.status === 'processing' ? '语音转换中' :
          '语音转换中'
        
        // 如果匹配到记录，使用记录的公司和职位信息
        // 否则尝试通过创建时间找到相近的schedule（在同一分钟内创建的）
        let matchedSchedule: InterviewSchedule | null = null
        if (!matchedRecord) {
          matchedSchedule = schedules.find(schedule => {
            const scheduleTime = new Date(schedule.createdAt).getTime()
            const taskTime = new Date(task.createdAt).getTime()
            // 如果schedule在任务创建前后5分钟内，可能是关联的
            return Math.abs(scheduleTime - taskTime) < 5 * 60 * 1000
          }) || null
        }
        
        items.push({
          id: task.id,
          type: 'task',
          status,
          taskStatus: task.status,
          audioFileName: task.audioFileName,
          transcript: task.transcript,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
          taskId: task.id,
          // 优先使用记录的信息，其次使用schedule的信息
          company: matchedRecord?.company || matchedSchedule?.company,
          position: matchedRecord?.position || matchedSchedule?.position,
          round: matchedRecord?.round || matchedSchedule?.round,
          interviewDate: matchedRecord?.interviewDate || matchedSchedule?.interviewDate
        })
      }
    })
    
    // 按创建时间倒序排列
    return items.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  const combinedItems = getCombinedItems()
  
  // 筛选逻辑
  const filteredItems = combinedItems.filter(item => {
    // 搜索词筛选
    const matchesSearch = 
      item.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.audioFileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.transcript?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // 状态筛选
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const filteredRecords = records.filter(record => 
    record.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.transcript?.toLowerCase().includes(searchTerm.toLowerCase())
  )








  // 按公司分组，每个公司包含多个岗位
  const groupedByCompany = filteredRecords.reduce((acc, record) => {
    const company = record.company
    const position = record.position
    
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
    const round = record.round
    if (!positionData.roundDetails.has(round)) {
      positionData.roundDetails.set(round, [])
    }
    positionData.roundDetails.get(round)!.push(record)
    
    // 更新总轮次
    positionData.totalRounds = Math.max(positionData.totalRounds, round)
    acc[company].totalRounds = Math.max(acc[company].totalRounds, round)
    
    // 更新日期信息
    const interviewDate = new Date(record.interviewDate)
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
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href="/interview-sharings">
              <Share2 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">面经广场</span>
              <span className="sm:hidden">面经</span>
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
                {new Set(records.map(r => r.company)).size}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索公司、职位或面试内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="语音转换中">语音转换中</SelectItem>
                  <SelectItem value="转换完成">转换完成</SelectItem>
                  <SelectItem value="复盘完成">复盘完成</SelectItem>
                  <SelectItem value="转换失败">转换失败</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统一的表格列表 */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "没有找到匹配的记录" : "暂无面试复盘记录"}
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
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-xl sm:text-2xl">面试复盘</CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1">您的面试复盘记录和任务状态</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">公司/文件</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">职位</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">状态</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">创建时间</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const getStatusBadge = () => {
                      switch (item.status) {
                        case '语音转换中':
                          return (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              语音转换中
                            </Badge>
                          )
                        case '转换完成':
                          return (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              转换完成
                            </Badge>
                          )
                        case '复盘完成':
                          return (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              复盘完成
                            </Badge>
                          )
                        case '转换失败':
                          return (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              转换失败
                            </Badge>
                          )
                      }
                    }
                    
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {item.company || item.audioFileName || '-'}
                          </div>
                          {item.type === 'task' && item.audioFileName && !item.company && (
                            <div className="text-xs text-gray-500 mt-1">
                              录音文件：{item.audioFileName}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.position ? (
                            <Badge variant="secondary" className="text-xs">
                              {item.position}
                              {item.round && ` · 第${item.round}轮`}
                            </Badge>
                          ) : item.type === 'task' ? (
                            <span className="text-sm text-gray-400 italic">未绑定面试</span>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(item.createdAt), "MM月dd日 HH:mm", { locale: zhCN })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {item.type === 'record' ? (
                              <>
                                <Button asChild variant="outline" size="sm">
                                  <Link href={`/interviews/${item.id}`}>
                                    查看
                                  </Link>
                                </Button>
                                {!item.aiAnalysis && item.transcript && (
                                  <Button asChild variant="default" size="sm">
                                    <Link href={`/interviews/new?transcript=${encodeURIComponent(item.transcript || '')}`}>
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      去做AI分析
                                    </Link>
                                  </Button>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setItemToDelete(item)
                                    setDeleteConfirmOpen(true)
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                {item.status === '转换完成' && item.transcript ? (
                                  <>
                                    <Button asChild variant="default" size="sm">
                                      <Link href={`/interviews/new?transcript=${encodeURIComponent(item.transcript)}&taskId=${item.taskId}`}>
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        去做AI分析
                                      </Link>
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setItemToDelete(item)
                                        setDeleteConfirmOpen(true)
                                      }}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </>
                                ) : item.status === '转换失败' ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setItemToDelete(item)
                                      setDeleteConfirmOpen(true)
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    删除
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setItemToDelete(item)
                                      setDeleteConfirmOpen(true)
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    disabled={item.status === '语音转换中' && item.taskStatus === 'processing'}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
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

      {/* 删除确认对话框 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除{itemToDelete?.type === 'task' ? '这个转录任务' : '这条面试记录'}吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          {itemToDelete && (
            <div className="py-4">
              <div className="text-sm text-gray-600 space-y-1">
                {itemToDelete.type === 'task' ? (
                  <>
                    <p><span className="font-medium">文件：</span>{itemToDelete.audioFileName}</p>
                    {itemToDelete.company && <p><span className="font-medium">公司：</span>{itemToDelete.company}</p>}
                    <p><span className="font-medium">状态：</span>{itemToDelete.status}</p>
                  </>
                ) : (
                  <>
                    <p><span className="font-medium">公司：</span>{itemToDelete.company}</p>
                    <p><span className="font-medium">职位：</span>{itemToDelete.position}</p>
                    <p><span className="font-medium">状态：</span>{itemToDelete.status}</p>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteConfirmOpen(false)
                setItemToDelete(null)
              }}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}