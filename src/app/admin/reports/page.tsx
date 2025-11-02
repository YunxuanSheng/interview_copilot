"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart3,
  TrendingUp,
  Users,
  Sparkles,
  Coins,
  Calendar
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

interface StatsData {
  users: {
    total: number
    active: number
    admins: number
    inactive: number
    newToday: number
    newThisMonth: number
    registrationTrend: Array<{
      date: string
      count: number
    }>
  }
  credits: {
    totalBalance: number
    totalDailyUsed: number
    totalMonthlyUsed: number
    averageBalance: number
    usageTrend: Array<{
      date: string
      used: number
    }>
  }
  aiUsage: {
    byService: Array<{
      serviceType: string
      totalCount: number
      lastUsed: Date | null
    }>
    total: number
    trend: Array<{
      date: string
      count: number
    }>
  }
  modelCalls: {
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

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899']

export default function AdminReportsPage() {
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
        <p className="text-gray-600">获取数据失败</p>
      </div>
    )
  }

  const getServiceName = (serviceType: string) => {
    const names: Record<string, string> = {
      interview_analysis: "面试分析",
      audio_transcription: "音频转录",
      suggestion_generation: "建议生成",
      job_parsing: "岗位解析",
      resume_parsing: "简历解析",
      email_parsing: "邮件解析"
    }
    return names[serviceType] || serviceType
  }

  // 格式化日期显示（只显示月-日）
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // 准备图表数据
  const userChartData = stats.users.registrationTrend.map(item => ({
    date: formatDate(item.date),
    fullDate: item.date,
    count: item.count
  }))

  const creditsChartData = stats.credits.usageTrend.map(item => ({
    date: formatDate(item.date),
    fullDate: item.date,
    used: item.used
  }))

  const aiUsageChartData = stats.aiUsage.trend.map(item => ({
    date: formatDate(item.date),
    fullDate: item.date,
    count: item.count
  }))

  const aiServicePieData = stats.aiUsage.byService.map(service => ({
    name: getServiceName(service.serviceType),
    value: service.totalCount
  }))

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">数据报表</h1>
        <p className="text-gray-600 mt-1">系统数据统计和分析</p>
      </div>

      {/* 用户统计报表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            用户统计报表
          </CardTitle>
          <CardDescription>用户相关的统计数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">总用户数</div>
              <div className="text-2xl font-bold text-blue-900">{stats.users.total}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 mb-1">活跃用户</div>
              <div className="text-2xl font-bold text-green-900">{stats.users.active}</div>
              <div className="text-xs text-green-700 mt-1">
                占比: {stats.users.total > 0 ? Math.round((stats.users.active / stats.users.total) * 100) : 0}%
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 mb-1">管理员</div>
              <div className="text-2xl font-bold text-purple-900">{stats.users.admins}</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600 mb-1">今日新增</div>
              <div className="text-2xl font-bold text-orange-900">{stats.users.newToday}</div>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg">
              <div className="text-sm text-pink-600 mb-1">本月新增</div>
              <div className="text-2xl font-bold text-pink-900">{stats.users.newThisMonth}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-red-600 mb-1">禁用用户</div>
              <div className="text-2xl font-bold text-red-900">{stats.users.inactive}</div>
            </div>
          </div>
          
          {/* 用户注册趋势折线图 */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">用户注册趋势（最近30天）</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `日期: ${label}`}
                  formatter={(value: number) => [`${value} 人`, '注册数']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="注册用户数"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* AI 使用统计报表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI 服务使用统计报表
          </CardTitle>
          <CardDescription>按服务类型的 AI 使用情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-blue-900 font-medium">总使用次数</span>
              <span className="text-3xl font-bold text-blue-600">
                {stats.aiUsage.total.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 饼图 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">服务类型分布</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={aiServicePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {aiServicePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} 次`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 柱状图 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">服务使用量对比</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={aiServicePieData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value} 次`} />
                  <Bar dataKey="value" fill="#3b82f6" name="使用次数" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI 使用趋势折线图 */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">AI 使用趋势（最近30天）</h3>
            {aiUsageChartData.some(item => item.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={aiUsageChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => `日期: ${label}`}
                    formatter={(value: number) => [`${value} 次`, '使用次数']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="AI 使用次数"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">暂无历史数据</p>
                  <p className="text-sm text-gray-500 mt-1">
                    模型调用日志功能已启用，新的调用将在此显示
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credits 统计报表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Credits 统计报表
          </CardTitle>
          <CardDescription>Credits 使用和余额统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">总 Credits 余额</div>
              <div className="text-2xl font-bold text-blue-900">
                {stats.credits.totalBalance.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 mb-1">平均 Credits 余额</div>
              <div className="text-2xl font-bold text-green-900">
                {Math.round(stats.credits.averageBalance).toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600 mb-1">今日已使用</div>
              <div className="text-2xl font-bold text-orange-900">
                {stats.credits.totalDailyUsed.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 mb-1">本月已使用</div>
              <div className="text-2xl font-bold text-purple-900">
                {stats.credits.totalMonthlyUsed.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Credits 使用趋势折线图 */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Credits 使用趋势（最近30天）</h3>
            {creditsChartData.some(item => item.used > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={creditsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => `日期: ${label}`}
                    formatter={(value: number) => [`${value}`, '使用量']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="used" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Credits 使用量"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Coins className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">暂无历史数据</p>
                  <p className="text-sm text-gray-500 mt-1">
                    模型调用日志功能已启用，新的调用将在此显示
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 模型调用和成本统计 */}
      {stats.modelCalls && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              模型调用与成本统计
            </CardTitle>
            <CardDescription>AI 模型调用次数、Tokens 使用和成本统计</CardDescription>
          </CardHeader>
          <CardContent>
            {/* 总览卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">总调用次数</div>
                <div className="text-2xl font-bold text-blue-900">
                  {stats.modelCalls.totalCalls.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 mb-1">总成本</div>
                <div className="text-2xl font-bold text-green-900">
                  {stats.modelCalls.totalCostFormatted}
                </div>
                <div className="text-xs text-green-700 mt-1">
                  估算成本（人民币）
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600 mb-1">总 Tokens</div>
                <div className="text-2xl font-bold text-purple-900">
                  {stats.modelCalls.totalTokens.toLocaleString()}
                </div>
                <div className="text-xs text-purple-700 mt-1">
                  {(stats.modelCalls.totalTokens / 1000).toFixed(1)}K tokens
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-600 mb-1">平均成本</div>
                <div className="text-2xl font-bold text-orange-900">
                  {stats.modelCalls.totalCalls > 0 
                    ? `¥${(stats.modelCalls.totalCost / stats.modelCalls.totalCalls).toFixed(4)}`
                    : '¥0.0000'
                  }
                </div>
                <div className="text-xs text-orange-700 mt-1">每次调用</div>
              </div>
            </div>

            {/* 按模型统计的表格 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">模型调用详情</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">模型名称</th>
                      <th className="text-left p-3">提供商</th>
                      <th className="text-right p-3">调用次数</th>
                      <th className="text-right p-3">总 Tokens</th>
                      <th className="text-right p-3">总成本</th>
                      <th className="text-right p-3">平均成本</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.modelCalls.byModel.map((model, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium">{model.modelName}</div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-gray-600 capitalize">
                            {model.provider}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-medium">
                            {model.callCount.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-sm">
                            {model.totalTokens.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-medium text-green-600">
                            ¥{model.estimatedCost.toFixed(4)}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-sm text-gray-600">
                            ¥{model.averageCost.toFixed(4)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {stats.modelCalls.byModel.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500">
                          暂无模型调用记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 模型调用成本对比图表 */}
            {stats.modelCalls.byModel.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">模型调用次数对比</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.modelCalls.byModel}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="modelName" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value} 次`, '调用次数']} />
                      <Bar dataKey="callCount" fill="#3b82f6" name="调用次数" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">模型成本对比</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.modelCalls.byModel}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="modelName" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`¥${value.toFixed(4)}`, '成本']}
                      />
                      <Bar dataKey="estimatedCost" fill="#10b981" name="总成本" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 内容统计报表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            内容统计报表
          </CardTitle>
          <CardDescription>用户创建的内容统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-sm text-blue-600 mb-1">面试安排</div>
              <div className="text-2xl font-bold text-blue-900">
                {stats.content.schedules.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-sm text-green-600 mb-1">面试记录</div>
              <div className="text-2xl font-bold text-green-900">
                {stats.content.interviews.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-sm text-purple-600 mb-1">面经分享</div>
              <div className="text-2xl font-bold text-purple-900">
                {stats.content.sharings.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg text-center">
              <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-sm text-orange-600 mb-1">项目整理</div>
              <div className="text-2xl font-bold text-orange-900">
                {stats.content.projects.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

