"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Building, Users, MapPin, Clock, ExternalLink, Edit, Trash2, Mail, Phone, Globe } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

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

export default function ScheduleDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [schedule, setSchedule] = useState<InterviewSchedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (session && params.id) {
      fetchSchedule()
    }
  }, [session, params.id])

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`/api/schedules/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSchedule(data)
      } else {
        // 如果是demo用户，返回模拟数据
        if (session?.user?.email === "demo@example.com") {
          const mockSchedule = {
            id: params.id,
            company: "腾讯",
            position: "前端开发工程师",
            department: "技术部",
            interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            interviewLink: "https://meeting.example.com/room/123",
            round: 2,
            tags: "技术面试,前端,React",
            notes: "第二轮技术面试，主要考察React和前端工程化能力。面试官是技术负责人，需要准备项目经验分享。",
            status: "scheduled",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
          setSchedule(mockSchedule)
        } else {
          router.push("/schedules")
        }
      }
    } catch (error) {
      console.error("Failed to fetch schedule:", error)
      router.push("/schedules")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!schedule || !confirm("确定要删除这个面试安排吗？")) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/schedules/${schedule.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        router.push("/schedules")
      } else {
        alert("删除失败，请重试")
      }
    } catch (error) {
      console.error("Delete schedule error:", error)
      alert("删除失败，请重试")
    } finally {
      setIsDeleting(false)
    }
  }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "text-blue-600"
      case "completed":
        return "text-green-600"
      case "cancelled":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可查看面试详情</p>
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
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!schedule) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">面试安排不存在</h2>
          <p className="text-gray-600 mb-6">该面试安排可能已被删除或不存在</p>
          <Button asChild>
            <Link href="/schedules">返回日程</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/schedules">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{schedule.company}</h1>
          <p className="text-gray-600 mt-1">{schedule.position}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(schedule.status)}
          <Button asChild variant="outline">
            <Link href={`/schedules/${schedule.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              编辑
            </Link>
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? "删除中..." : "删除"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                面试基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">公司名称</label>
                  <p className="text-lg font-semibold">{schedule.company}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">职位</label>
                  <p className="text-lg font-semibold">{schedule.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">部门</label>
                  <p className="text-lg">{schedule.department || "未指定"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">面试轮次</label>
                  <p className="text-lg">第 {schedule.round} 轮</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 面试详情 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                面试详情
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">面试时间</label>
                  <p className="text-lg font-semibold">
                    {format(new Date(schedule.interviewDate), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">状态</label>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(schedule.status)}
                    <span className={`text-sm ${getStatusColor(schedule.status)}`}>
                      {schedule.status === "scheduled" && "即将进行"}
                      {schedule.status === "completed" && "已完成"}
                      {schedule.status === "cancelled" && "已取消"}
                    </span>
                  </div>
                </div>
              </div>

              {schedule.interviewLink && (
                <div>
                  <label className="text-sm font-medium text-gray-600">面试链接</label>
                  <div className="flex items-center gap-2 mt-1">
                    <a 
                      href={schedule.interviewLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      进入面试
                    </a>
                  </div>
                </div>
              )}

              {schedule.tags && (
                <div>
                  <label className="text-sm font-medium text-gray-600">标签</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {schedule.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {schedule.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">备注</label>
                  <p className="text-gray-700 mt-1 whitespace-pre-wrap">{schedule.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 相关面试记录 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                相关面试记录
              </CardTitle>
              <CardDescription>
                该面试安排的记录和复盘
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无相关面试记录</p>
                <p className="text-sm">面试完成后可以添加记录</p>
                <Button asChild className="mt-4">
                  <Link href={`/interviews/new?scheduleId=${schedule.id}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    添加面试记录
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}
