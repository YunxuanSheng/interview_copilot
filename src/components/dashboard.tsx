"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, BookOpen, TrendingUp, Clock, CheckCircle, Mail, Mic } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalSchedules: number
  completedInterviews: number
  totalExperiences: number
  upcomingInterviews: number
}

interface UpcomingInterview {
  id: string
  company: string
  position: string
  interviewDate: string
  round: number
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalSchedules: 0,
    completedInterviews: 0,
    totalExperiences: 0,
    upcomingInterviews: 0
  })
  const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchDashboardData()
    }
  }, [session])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard")
      const data = await response.json()
      setStats(data.stats)
      setUpcomingInterviews(data.upcomingInterviews)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
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
                <Calendar className="w-6 h-6 text-blue-600" />
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
              <h3 className="font-semibold text-gray-900 mb-2">个人面经库</h3>
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
          今天有 {stats.upcomingInterviews} 场面试安排，继续加油！
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/schedules">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总面试安排</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSchedules}</div>
              <p className="text-xs text-muted-foreground">
                所有面试安排
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/interviews">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已完成面试</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedInterviews}</div>
              <p className="text-xs text-muted-foreground">
                已完成的面试
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/experiences">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">面经题目</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExperiences}</div>
              <p className="text-xs text-muted-foreground">
                个人面经库题目
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/schedules">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">即将面试</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingInterviews}</div>
              <p className="text-xs text-muted-foreground">
                未来7天内的面试
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>常用功能快速入口</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="/schedules/parse-email">
                <Mail className="mr-2 h-4 w-4" />
                📧 智能添加日程
              </Link>
            </Button>
            <Button asChild className="w-full justify-start bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <Link href="/interviews/new">
                <Mic className="mr-2 h-4 w-4" />
                🎤 添加面试记录
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/schedules/new">
                <Calendar className="mr-2 h-4 w-4" />
                手动添加面试
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/interviews/new">
                <FileText className="mr-2 h-4 w-4" />
                手动记录复盘
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>即将到来的面试</CardTitle>
            <CardDescription>最近的面试安排</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingInterviews.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无即将到来的面试</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/schedules/new">添加面试安排</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between p-3 border rounded-lg">
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>最近活动</CardTitle>
          <CardDescription>您的面试管理活动记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>暂无最近活动</p>
            <p className="text-sm">开始使用AI面试助理来管理您的面试吧！</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
