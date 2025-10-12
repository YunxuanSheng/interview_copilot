"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Plus, Search, Calendar, Building, MessageSquare, Mic, TrendingUp, Users, Target } from "lucide-react"
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

export default function InterviewsPage() {
  const { data: session } = useSession()
  const [records, setRecords] = useState<InterviewRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (session) {
      fetchRecords()
    }
  }, [session])

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

  const getProgressStatus = (position: {
    completedRounds: number
    totalRounds: number
    passedRounds: number
  }) => {
    const { completedRounds, totalRounds, passedRounds } = position
    
    if (completedRounds === 0) {
      return { status: "投递", color: "bg-gray-100 text-gray-800", icon: "📝" }
    }
    
    if (completedRounds < totalRounds) {
      return { status: "面试中", color: "bg-blue-100 text-blue-800", icon: "🔄" }
    }
    
    if (completedRounds === totalRounds) {
      if (passedRounds === totalRounds) {
        return { status: "已通过", color: "bg-green-100 text-green-800", icon: "✅" }
      } else if (passedRounds > 0) {
        return { status: "部分通过", color: "bg-yellow-100 text-yellow-800", icon: "⚠️" }
      } else {
        return { status: "未通过", color: "bg-red-100 text-red-800", icon: "❌" }
      }
    }
    
    return { status: "进行中", color: "bg-yellow-100 text-yellow-800", icon: "⏳" }
  }

  const getCompanyStatus = (company: {
    positions: Map<string, {
      completedRounds: number
      totalRounds: number
      passedRounds: number
    }>
  }) => {
    const positions = Array.from(company.positions.values())
    const totalPositions = positions.length
    const completedPositions = positions.filter(p => p.completedRounds > 0).length
    const passedPositions = positions.filter(p => p.passedRounds === p.totalRounds && p.totalRounds > 0).length
    
    if (completedPositions === 0) {
      return { status: "投递中", color: "bg-gray-100 text-gray-800", icon: "📝" }
    }
    
    if (passedPositions === totalPositions) {
      return { status: "全部通过", color: "bg-green-100 text-green-800", icon: "🎉" }
    } else if (passedPositions > 0) {
      return { status: "部分通过", color: "bg-yellow-100 text-yellow-800", icon: "⚠️" }
    } else {
      return { status: "面试中", color: "bg-blue-100 text-blue-800", icon: "🔄" }
    }
  }


  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可查看面试记录</p>
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
          <h1 className="text-3xl font-bold text-gray-900">面试记录</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">面试记录</h1>
          <p className="text-gray-600 mt-1">管理您的面试记录和岗位进度</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
            <Link href="/interviews/new">
              <Mic className="w-4 h-4 mr-2" />
              添加面试记录
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/schedules/new">
              <Plus className="w-4 h-4 mr-2" />
              添加面试安排
            </Link>
          </Button>
        </div>
      </div>

      {/* 数据看板 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <FileText className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <p className="text-sm font-medium text-gray-600">总记录</p>
              <p className="text-xl font-bold text-gray-900">{records.length}</p>
            </div>
          </CardContent>
        </Card>
        
        
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <p className="text-sm font-medium text-gray-600">总问题数</p>
              <p className="text-xl font-bold text-gray-900">
                {records.reduce((sum, r) => sum + r.questions.length, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <Building className="h-6 w-6 mx-auto mb-1 text-orange-600" />
              <p className="text-sm font-medium text-gray-600">面试公司</p>
              <p className="text-xl font-bold text-gray-900">
                {new Set(records.map(r => r.schedule.company)).size}
              </p>
            </div>
          </CardContent>
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

      {/* 面试岗位进度概览 */}
      {Object.keys(groupedByCompany).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              面试岗位进度概览
            </CardTitle>
            <CardDescription>
              按公司分组的面试进度和统计概览
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.values(groupedByCompany).map((company, companyIndex) => {
                const companyStatus = getCompanyStatus(company)
                const positions = Array.from(company.positions.values())
                const totalPassRate = company.totalRounds > 0 ? Math.round((company.passedRounds / company.totalRounds) * 100) : 0
                
                return (
                  <div key={companyIndex} className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                    {/* 公司头部信息 */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-900 mb-2">{company.company}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {positions.length} 个岗位
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {company.totalQuestions} 个问题
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {company.firstInterviewDate && 
                              `开始: ${format(company.firstInterviewDate, "MM/dd", { locale: zhCN })}`
                            }
                          </span>
                        </div>
                      </div>
                      <Badge className={`${companyStatus.color} flex items-center gap-1 px-3 py-1`}>
                        <span>{companyStatus.icon}</span>
                        {companyStatus.status}
                      </Badge>
                    </div>
                    
                    {/* 公司总体统计 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">{company.totalRecords}</div>
                        <div className="text-sm text-blue-800">总面试</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">{totalPassRate}%</div>
                        <div className="text-sm text-green-800">通过率</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {company.averageScore > 0 ? company.averageScore.toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-sm text-purple-800">平均分</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-orange-600">{company.passedRounds}</div>
                        <div className="text-sm text-orange-800">通过轮次</div>
                      </div>
                    </div>
                    
                    {/* 岗位详情 */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 mb-3">岗位详情</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {positions.map((position, positionIndex) => {
                          const progressStatus = getProgressStatus(position)
                          const passRate = position.completedRounds > 0 ? Math.round((position.passedRounds / position.completedRounds) * 100) : 0
                          
                          return (
                            <div key={positionIndex} className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{position.position}</h5>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {position.completedRounds}/{position.totalRounds} 轮
                                  </div>
                                </div>
                                <Badge className={`${progressStatus.color} text-xs`}>
                                  {progressStatus.status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="text-center">
                                  <div className="font-semibold text-green-600">{passRate}%</div>
                                  <div className="text-gray-600">通过率</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold text-blue-600">
                                    {position.averageScore > 0 ? position.averageScore.toFixed(1) : 'N/A'}
                                  </div>
                                  <div className="text-gray-600">平均分</div>
                                </div>
                              </div>
                              
                              {/* 轮次进度 */}
                              <div className="mt-3">
                                <div className="flex gap-1">
                                  {Array.from({ length: position.totalRounds }, (_, i) => i + 1).map(round => {
                                    const hasRecord = position.roundDetails.has(round)
                                    const isPassed = hasRecord && position.roundDetails.get(round)!.some(record => 
                                      record.aiAnalysis && 
                                      (record.aiAnalysis.includes('通过') || 
                                       record.aiAnalysis.includes('优秀') || 
                                       record.aiAnalysis.includes('良好'))
                                    )
                                    return (
                                      <div
                                        key={round}
                                        className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium ${
                                          isPassed 
                                            ? 'bg-green-200 text-green-800' 
                                            : hasRecord 
                                              ? 'bg-red-200 text-red-800' 
                                              : 'bg-gray-200 text-gray-500'
                                        }`}
                                        title={`第${round}轮: ${isPassed ? '通过' : hasRecord ? '未通过' : '未面试'}`}
                                      >
                                        {round}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records Grid */}
      {Object.keys(groupedByCompany).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "没有找到匹配的面试记录" : "暂无面试记录"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? "尝试调整搜索条件" 
                : "开始记录您的第一次面试复盘"
              }
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/interviews/new">
                  <Mic className="w-4 h-4 mr-2" />
                  添加面试记录
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/schedules/new">
                  <Plus className="w-4 h-4 mr-2" />
                  添加面试安排
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedByCompany).map((company, companyIndex) => (
            <Card key={companyIndex} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{company.company}</CardTitle>
                    <CardDescription className="mt-1">
                      {Array.from(company.positions.keys()).join('、')} · {company.totalRecords}条面试记录
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getCompanyStatus(company).status === "全部通过" && (
                      <Badge className="bg-green-100 text-green-800">已完成</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Array.from(company.positions.values()).map((position, positionIndex) => (
                    <div key={positionIndex} className="border-l-4 border-blue-200 pl-4">
                      <h4 className="font-semibold text-lg text-gray-900 mb-3">{position.position}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {position.records.map((record) => (
                          <div key={record.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium">第{record.schedule.round}轮</h5>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {format(new Date(record.schedule.interviewDate), "MM月dd日", { locale: zhCN })}
                              </div>
                              
                              <div className="flex items-center">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                {record.questions.length} 个问题
                              </div>

                              {record.feedback && (
                                <p className="text-xs line-clamp-2">
                                  {record.feedback}
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2 mt-3">
                              <Button asChild variant="outline" size="sm" className="flex-1">
                                <Link href={`/interviews/${record.id}`}>
                                  查看
                                </Link>
                              </Button>
                              <Button asChild variant="outline" size="sm" className="flex-1">
                                <Link href={`/interviews/${record.id}/edit`}>
                                  编辑
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  )
}