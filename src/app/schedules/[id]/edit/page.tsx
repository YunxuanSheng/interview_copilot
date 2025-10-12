"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Calendar, Building, Users, Link as LinkIcon, Tag, FileText, Clock } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

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

export default function EditSchedulePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [schedule, setSchedule] = useState<InterviewSchedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    department: "",
    interviewDate: "",
    interviewTime: "",
    interviewLink: "",
    round: 1,
    tags: "",
    notes: "",
    status: "scheduled"
  })

  const fetchSchedule = useCallback(async () => {
    try {
      const response = await fetch(`/api/schedules/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSchedule(data)
        
        // 解析日期和时间
        const interviewDate = new Date(data.interviewDate)
        const dateStr = interviewDate.toISOString().split('T')[0]
        const timeStr = interviewDate.toTimeString().split(' ')[0].substring(0, 5)
        
        setFormData({
          company: data.company || "",
          position: data.position || "",
          department: data.department || "",
          interviewDate: dateStr,
          interviewTime: timeStr,
          interviewLink: data.interviewLink || "",
          round: data.round || 1,
          tags: data.tags || "",
          notes: data.notes || "",
          status: data.status || "scheduled"
        })
      } else {
        toast.error("获取面试安排失败")
        router.push("/schedules")
      }
    } catch (error) {
      console.error("Failed to fetch schedule:", error)
      toast.error("获取面试安排失败")
    } finally {
      setIsLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    if (session && params.id) {
      fetchSchedule()
    }
  }, [session, params.id, fetchSchedule])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.company.trim() || !formData.position.trim() || !formData.interviewDate) {
      toast.error("请填写必填字段")
      return
    }

    setIsSaving(true)
    try {
      // 合并日期和时间
      const interviewDateTime = new Date(`${formData.interviewDate}T${formData.interviewTime}:00`)
      
      const response = await fetch(`/api/schedules/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company: formData.company.trim(),
          position: formData.position.trim(),
          department: formData.department.trim(),
          interviewDate: interviewDateTime.toISOString(),
          interviewLink: formData.interviewLink.trim(),
          round: formData.round,
          tags: formData.tags.trim(),
          notes: formData.notes.trim(),
          status: formData.status
        })
      })

      if (response.ok) {
        toast.success("面试安排已更新")
        router.push(`/schedules/${params.id}`)
      } else {
        toast.error("更新失败")
      }
    } catch (error) {
      console.error("Failed to update schedule:", error)
      toast.error("更新失败")
    } finally {
      setIsSaving(false)
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可编辑面试安排</p>
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
          <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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

  if (!schedule) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">面试安排不存在</h2>
          <p className="text-gray-600 mb-6">该面试安排可能已被删除</p>
          <Button asChild>
            <Link href="/schedules">返回面试安排</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/schedules/${params.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">编辑面试安排</h1>
          <p className="text-gray-600 mt-1">
            {schedule.company} · {schedule.position}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              基本信息
            </CardTitle>
            <CardDescription>
              编辑面试的基本信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  公司名称 *
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  placeholder="请输入公司名称"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  职位名称 *
                </Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange("position", e.target.value)}
                  placeholder="请输入职位名称"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">部门</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange("department", e.target.value)}
                placeholder="请输入部门名称"
              />
            </div>
          </CardContent>
        </Card>

        {/* 面试时间 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              面试时间
            </CardTitle>
            <CardDescription>
              设置面试的日期和时间
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interviewDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  面试日期 *
                </Label>
                <Input
                  id="interviewDate"
                  type="date"
                  value={formData.interviewDate}
                  onChange={(e) => handleInputChange("interviewDate", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interviewTime" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  面试时间 *
                </Label>
                <Input
                  id="interviewTime"
                  type="time"
                  value={formData.interviewTime}
                  onChange={(e) => handleInputChange("interviewTime", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="round">面试轮次</Label>
                <Select
                  value={formData.round.toString()}
                  onValueChange={(value) => handleInputChange("round", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择面试轮次" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(round => (
                      <SelectItem key={round} value={round.toString()}>
                        第{round}轮
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">面试状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择面试状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">已安排</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 面试链接 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              面试链接
            </CardTitle>
            <CardDescription>
              添加面试会议链接
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="interviewLink" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                面试链接
              </Label>
              <Input
                id="interviewLink"
                type="url"
                value={formData.interviewLink}
                onChange={(e) => handleInputChange("interviewLink", e.target.value)}
                placeholder="https://meeting.example.com/room/123"
              />
            </div>
          </CardContent>
        </Card>

        {/* 标签和备注 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              标签和备注
            </CardTitle>
            <CardDescription>
              添加标签和备注信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tags" className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                标签
              </Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
                placeholder="技术面试,前端,React (用逗号分隔)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                备注
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="添加面试备注信息..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* 保存按钮 */}
        <div className="flex justify-end gap-4">
          <Button asChild variant="outline">
            <Link href={`/schedules/${params.id}`}>取消</Link>
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "保存中..." : "保存更改"}
          </Button>
        </div>
      </form>
    </div>
  )
}
