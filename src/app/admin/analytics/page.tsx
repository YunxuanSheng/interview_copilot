"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MousePointer,
  Zap,
  AlertTriangle,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Activity,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  FileText,
  Calendar,
  User,
  Globe,
  Smartphone as Mobile
} from "lucide-react"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface AnalyticsData {
  overview: {
    totalEvents: number
    uniqueUsers: number
    pageViews: number
    errors: number
  }
  byType: Array<{
    eventType: string
    count: number
  }>
  topEvents: Array<{
    eventName: string
    count: number
  }>
  trend: Array<{
    date: string
    count: number
    uniqueUsers: number
  }>
  featureUse: Array<{
    eventName: string
    count: number
  }>
  buttonClicks: Array<{
    eventName: string
    count: number
  }>
  funnel: Array<{
    step: string
    eventName: string
    count: number
  }>
  devices: Array<{
    type: string
    count: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

interface EventLog {
  id: string
  userId: string | null
  eventType: string
  eventName: string
  properties: any
  userAgent: string | null
  ipAddress: string | null
  pageUrl: string | null
  referrer: string | null
  screenWidth: number | null
  screenHeight: number | null
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
  } | null
}

interface EventLogsResponse {
  events: EventLog[]
  total: number
  limit: number
  offset: number
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30')
  
  // 事件列表相关状态
  const [showEventList, setShowEventList] = useState(false)
  const [eventLogs, setEventLogs] = useState<EventLogsResponse | null>(null)
  const [eventLogsLoading, setEventLogsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterEventType, setFilterEventType] = useState("")
  const [filterEventName, setFilterEventName] = useState("")
  const [filterUserId, setFilterUserId] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  useEffect(() => {
    if (showEventList) {
      fetchEventLogs()
    }
  }, [showEventList, currentPage, searchQuery, filterEventType, filterEventName, filterUserId, dateRange])

  const fetchAnalytics = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(
        Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0]

      const response = await fetch(
        `/api/admin/analytics?startDate=${startDate}&endDate=${endDate}`
      )
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error("获取埋点数据失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEventLogs = async () => {
    setEventLogsLoading(true)
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(
        Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0]

      const params = new URLSearchParams({
        limit: '50',
        offset: ((currentPage - 1) * 50).toString(),
        startDate,
        endDate,
      })

      if (filterEventType) params.append('eventType', filterEventType)
      if (filterEventName) params.append('eventName', filterEventName)
      if (filterUserId) params.append('userId', filterUserId)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/analytics?${params}`)
      const result = await response.json()
      if (result.success) {
        setEventLogs(result.data)
      }
    } catch (error) {
      console.error("获取事件列表失败:", error)
    } finally {
      setEventLogsLoading(false)
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

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">获取数据失败</p>
          <Button onClick={fetchAnalytics}>重试</Button>
        </div>
      </div>
    )
  }

  // 格式化事件类型名称
  const formatEventType = (type: string) => {
    const map: Record<string, string> = {
      page_view: '页面访问',
      button_click: '按钮点击',
      feature_use: '功能使用',
      error: '错误',
      api_call: 'API调用',
      form_submit: '表单提交',
      download: '下载',
      share: '分享',
      search: '搜索',
      custom: '自定义',
    }
    return map[type] || type
  }

  // 格式化设备类型
  const formatDeviceType = (type: string) => {
    const map: Record<string, string> = {
      desktop: '桌面端',
      tablet: '平板',
      mobile: '移动端',
    }
    return map[type] || type
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">埋点数据分析</h1>
          <p className="text-gray-600 mt-1">用户行为追踪和统计分析</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={dateRange === '7' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('7')}
          >
            最近7天
          </Button>
          <Button
            variant={dateRange === '30' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('30')}
          >
            最近30天
          </Button>
          <Button
            variant={dateRange === '90' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('90')}
          >
            最近90天
          </Button>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总事件数</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">所有类型事件</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">独立用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.uniqueUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">唯一访问用户</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">页面访问</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">页面浏览量(PV)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">错误数</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.errors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">捕获的错误事件</p>
          </CardContent>
        </Card>
      </div>

      {/* 趋势图表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            事件趋势
          </CardTitle>
          <CardDescription>最近{dateRange}天的事件数量和独立用户数趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#0088FE" 
                name="事件数"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="uniqueUsers" 
                stroke="#00C49F" 
                name="独立用户"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 事件类型分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              事件类型分布
            </CardTitle>
            <CardDescription>按事件类型统计</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.byType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ eventType, count }) => `${formatEventType(eventType)}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 设备类型分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              设备类型分布
            </CardTitle>
            <CardDescription>用户设备统计</CardDescription>
          </CardHeader>
          <CardContent>
            {data.devices.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.devices}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="type" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatDeviceType}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                暂无设备数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 事件 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            热门事件 Top 10
          </CardTitle>
          <CardDescription>最常触发的事件</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.topEvents.map((event, index) => (
              <div
                key={event.eventName}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 w-6">
                    #{index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{event.eventName}</span>
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  {event.count.toLocaleString()} 次
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 功能使用统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              功能使用统计
            </CardTitle>
            <CardDescription>用户功能使用情况</CardDescription>
          </CardHeader>
          <CardContent>
            {data.featureUse.length > 0 ? (
              <div className="space-y-2">
                {data.featureUse.map((feature) => (
                  <div
                    key={feature.eventName}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-900">{feature.eventName}</span>
                    <span className="text-sm text-gray-600 font-medium">
                      {feature.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">暂无功能使用数据</div>
            )}
          </CardContent>
        </Card>

        {/* 按钮点击统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="w-5 h-5" />
              按钮点击统计
            </CardTitle>
            <CardDescription>用户按钮点击情况</CardDescription>
          </CardHeader>
          <CardContent>
            {data.buttonClicks.length > 0 ? (
              <div className="space-y-2">
                {data.buttonClicks.map((button) => (
                  <div
                    key={button.eventName}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-900">{button.eventName}</span>
                    <span className="text-sm text-gray-600 font-medium">
                      {button.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">暂无按钮点击数据</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 转化漏斗 */}
      {data.funnel.length > 0 && data.funnel.some(f => f.count > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              转化漏斗
            </CardTitle>
            <CardDescription>用户转化路径分析</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.funnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="step" 
                  type="category" 
                  tick={{ fontSize: 12 }}
                  width={120}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 详细事件列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                详细事件列表
                {eventLogs && (
                  <Badge variant="outline" className="ml-2">
                    {eventLogs.total.toLocaleString()} 条记录
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>查看所有埋点事件的详细信息</CardDescription>
            </div>
            <Button
              variant={showEventList ? "default" : "outline"}
              onClick={() => {
                setShowEventList(!showEventList)
                if (!showEventList) {
                  setCurrentPage(1)
                }
              }}
            >
              {showEventList ? (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  收起列表
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4 mr-2" />
                  展开列表
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {showEventList && (
          <CardContent className="space-y-4">
            {/* 搜索和筛选 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索事件名、URL、用户..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      fetchEventLogs()
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={filterEventType || "all"}
                onValueChange={(v) => {
                  setFilterEventType(v === "all" ? "" : v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="事件类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有类型</SelectItem>
                  <SelectItem value="page_view">页面访问</SelectItem>
                  <SelectItem value="button_click">按钮点击</SelectItem>
                  <SelectItem value="feature_use">功能使用</SelectItem>
                  <SelectItem value="error">错误</SelectItem>
                  <SelectItem value="api_call">API调用</SelectItem>
                  <SelectItem value="form_submit">表单提交</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="事件名称..."
                value={filterEventName}
                onChange={(e) => {
                  setFilterEventName(e.target.value)
                  setCurrentPage(1)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchEventLogs()
                  }
                }}
              />
              <Input
                placeholder="用户ID..."
                value={filterUserId}
                onChange={(e) => {
                  setFilterUserId(e.target.value)
                  setCurrentPage(1)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchEventLogs()
                  }
                }}
              />
            </div>

            {/* 事件表格 */}
            {eventLogsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">加载中...</p>
                </div>
              </div>
            ) : eventLogs && eventLogs.events.length > 0 ? (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            时间
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            事件类型
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            事件名称
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            用户
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            页面URL
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            设备
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {eventLogs.events.map((event) => (
                          <tr key={event.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {format(new Date(event.createdAt), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge
                                variant={
                                  event.eventType === "error"
                                    ? "destructive"
                                    : event.eventType === "page_view"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {formatEventType(event.eventType)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                              {event.eventName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {event.user ? (
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <span>{event.user.email}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">匿名</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                              {event.pageUrl ? (
                                <div className="flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-gray-400" />
                                  <span className="truncate">{event.pageUrl}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {event.screenWidth && event.screenHeight ? (
                                <div className="flex items-center gap-1">
                                  {event.screenWidth < 768 ? (
                                    <Mobile className="w-4 h-4" />
                                  ) : event.screenWidth < 1024 ? (
                                    <Tablet className="w-4 h-4" />
                                  ) : (
                                    <Monitor className="w-4 h-4" />
                                  )}
                                  <span>
                                    {event.screenWidth}×{event.screenHeight}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedEvent(event)}
                              >
                                查看详情
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 分页 */}
                {eventLogs.total > 50 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      显示 {(currentPage - 1) * 50 + 1} -{" "}
                      {Math.min(currentPage * 50, eventLogs.total)} 条，共{" "}
                      {eventLogs.total} 条
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        上一页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) =>
                            Math.min(
                              Math.ceil(eventLogs.total / 50),
                              p + 1
                            )
                          )
                        }
                        disabled={
                          currentPage >= Math.ceil(eventLogs.total / 50)
                        }
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-12">
                暂无事件数据
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* 事件详情弹窗 */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>事件详情</DialogTitle>
            <DialogDescription>
              {selectedEvent?.eventName} - {formatEventType(selectedEvent?.eventType || "")}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">事件ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedEvent.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">发生时间</label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(selectedEvent.createdAt), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">事件类型</label>
                  <p className="text-sm text-gray-900">
                    <Badge>{formatEventType(selectedEvent.eventType)}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">事件名称</label>
                  <p className="text-sm text-gray-900">{selectedEvent.eventName}</p>
                </div>
              </div>

              {selectedEvent.user && (
                <div>
                  <label className="text-sm font-medium text-gray-500">用户信息</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded">
                    <p className="text-sm">
                      <strong>邮箱:</strong> {selectedEvent.user.email}
                    </p>
                    {selectedEvent.user.name && (
                      <p className="text-sm">
                        <strong>姓名:</strong> {selectedEvent.user.name}
                      </p>
                    )}
                    <p className="text-sm">
                      <strong>用户ID:</strong> {selectedEvent.user.id}
                    </p>
                  </div>
                </div>
              )}

              {selectedEvent.pageUrl && (
                <div>
                  <label className="text-sm font-medium text-gray-500">页面URL</label>
                  <p className="text-sm text-gray-900 break-all">{selectedEvent.pageUrl}</p>
                </div>
              )}

              {selectedEvent.referrer && (
                <div>
                  <label className="text-sm font-medium text-gray-500">来源页面</label>
                  <p className="text-sm text-gray-900 break-all">{selectedEvent.referrer}</p>
                </div>
              )}

              {(selectedEvent.screenWidth || selectedEvent.screenHeight) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">设备信息</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded">
                    <p className="text-sm">
                      <strong>屏幕尺寸:</strong> {selectedEvent.screenWidth}×{selectedEvent.screenHeight}
                    </p>
                    {selectedEvent.userAgent && (
                      <p className="text-sm mt-2 break-all">
                        <strong>User-Agent:</strong> {selectedEvent.userAgent}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedEvent.ipAddress && (
                <div>
                  <label className="text-sm font-medium text-gray-500">IP地址</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedEvent.ipAddress}</p>
                </div>
              )}

              {selectedEvent.properties && Object.keys(selectedEvent.properties).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">自定义属性</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedEvent.properties, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

