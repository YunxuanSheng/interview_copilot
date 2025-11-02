"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  UserCheck, 
  Shield, 
  Coins, 
  TrendingUp, 
  FileText,
  Calendar,
  Share2,
  FolderOpen,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface StatsData {
  users: {
    total: number
    active: number
    admins: number
    inactive: number
    newToday: number
    newThisMonth: number
    recent: Array<{
      id: string
      email: string
      name: string | null
      role: string
      createdAt: string
    }>
  }
  credits: {
    totalBalance: number
    totalDailyUsed: number
    totalMonthlyUsed: number
    averageBalance: number
    topUsers: Array<{
      email: string
      name: string | null
      balance: number
    }>
  }
  aiUsage: {
    byService: Array<{
      serviceType: string
      totalCount: number
      lastUsed: Date | null
    }>
    total: number
  }
  modelCalls?: {
    byModel: Array<{
      modelName: string
      provider: string
      callCount: number
      totalPromptTokens: number
      totalCompletionTokens: number
      totalTokens: number
      estimatedCost: number
      creditsUsed: number
      averageCost: number
    }>
    totalCalls: number
    totalCost: number
    totalCostFormatted: string
    totalTokens: number
  }
  content: {
    schedules: number
    interviews: number
    sharings: number
    projects: number
  }
}

export default function AdminPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("获取统计数据失败:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">获取数据失败</p>
          <Button onClick={fetchStats}>重试</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">数据概览</h1>
        <p className="text-gray-600 mt-1">系统整体数据统计</p>
      </div>

      {/* 用户统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              活跃: {stats.users.active} | 禁用: {stats.users.inactive}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管理员</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.admins}</div>
            <p className="text-xs text-muted-foreground">管理员账户数量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日新增</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.newToday}</div>
            <p className="text-xs text-muted-foreground">
              本月新增: {stats.users.newThisMonth}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits 总量</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.credits.totalBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              平均: {Math.round(stats.credits.averageBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credits 使用统计 */}
      <Card>
        <CardHeader>
          <CardTitle>Credits 使用统计</CardTitle>
          <CardDescription>今日和本月 Credits 使用情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-2">今日已使用</div>
              <div className="text-2xl font-bold text-blue-900">
                {stats.credits.totalDailyUsed.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 mb-2">本月已使用</div>
              <div className="text-2xl font-bold text-purple-900">
                {stats.credits.totalMonthlyUsed.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/admin/credits">
              <Button variant="outline" size="sm">
                查看详细 Credits 管理 →
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* AI 使用统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI 服务使用统计
          </CardTitle>
          <CardDescription>按服务类型的 AI 使用情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.aiUsage.byService.map((service) => (
              <div key={service.serviceType} className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">
                  {service.serviceType === "interview_analysis" && "面试分析"}
                  {service.serviceType === "audio_transcription" && "音频转录"}
                  {service.serviceType === "suggestion_generation" && "建议生成"}
                  {service.serviceType === "job_parsing" && "岗位解析"}
                  {service.serviceType === "resume_parsing" && "简历解析"}
                  {service.serviceType === "email_parsing" && "邮件解析"}
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {service.totalCount}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-blue-900 font-medium">总使用次数</span>
                <span className="text-2xl font-bold text-blue-600">
                  {stats.aiUsage.total}
                </span>
              </div>
            </div>
            {stats.modelCalls && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-green-900 font-medium">总成本</span>
                  <span className="text-2xl font-bold text-green-600">
                    {stats.modelCalls.totalCostFormatted}
                  </span>
                </div>
                <div className="text-xs text-green-700 mt-1">
                  {stats.modelCalls.totalCalls} 次调用 · {stats.modelCalls.totalTokens.toLocaleString()} tokens
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 内容统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">面试安排</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.content.schedules}</div>
            <p className="text-xs text-muted-foreground">总面试安排数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">面试记录</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.content.interviews}</div>
            <p className="text-xs text-muted-foreground">总面试记录数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">面经分享</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.content.sharings}</div>
            <p className="text-xs text-muted-foreground">公开面经数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">项目整理</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.content.projects}</div>
            <p className="text-xs text-muted-foreground">总项目数</p>
          </CardContent>
        </Card>
      </div>

      {/* 最近注册用户 */}
      <Card>
        <CardHeader>
          <CardTitle>最近注册用户</CardTitle>
          <CardDescription>最近7天注册的用户</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.users.recent.length > 0 ? (
            <div className="space-y-2">
              {stats.users.recent.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.name || user.email}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </div>
                    {user.role === "admin" && (
                      <div className="text-xs text-blue-600">管理员</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">暂无最近注册的用户</p>
          )}
          <div className="mt-4">
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                查看所有用户 →
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

