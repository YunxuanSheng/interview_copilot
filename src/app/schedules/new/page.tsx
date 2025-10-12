"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, Building, Briefcase, Users, Link as LinkIcon, Tag, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function NewSchedulePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    department: "",
    interviewDate: "",
    interviewTime: "",
    interviewLink: "",
    round: "1",
    tags: "",
    notes: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast.error("请先登录")
      return
    }

    setIsLoading(true)

    try {
      const interviewDateTime = new Date(`${formData.interviewDate}T${formData.interviewTime}`)
      
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          interviewDate: interviewDateTime.toISOString(),
          round: parseInt(formData.round)
        }),
      })

      if (response.ok) {
        toast.success("面试安排创建成功！")
        router.push("/schedules")
      } else {
        toast.error("创建失败，请重试")
      }
    } catch (error) {
      console.error("Create schedule error:", error)
      toast.error("创建失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可添加面试安排</p>
          <Button asChild>
            <Link href="/auth/signin">立即登录</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/schedules">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">添加面试安排</h1>
          <p className="text-gray-600 mt-1">填写面试信息以创建新的面试安排</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>面试信息</CardTitle>
          <CardDescription>
            请填写完整的面试信息，所有带 * 的字段为必填项
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company and Position */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  公司名称 *
                </Label>
                <Input
                  id="company"
                  placeholder="例如：腾讯"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  职位 *
                </Label>
                <Input
                  id="position"
                  placeholder="例如：前端开发工程师"
                  value={formData.position}
                  onChange={(e) => handleInputChange("position", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                部门
              </Label>
              <Input
                id="department"
                placeholder="例如：技术部"
                value={formData.department}
                onChange={(e) => handleInputChange("department", e.target.value)}
              />
            </div>

            {/* Interview Date and Time */}
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
                <Label htmlFor="interviewTime">面试时间 *</Label>
                <Input
                  id="interviewTime"
                  type="time"
                  value={formData.interviewTime}
                  onChange={(e) => handleInputChange("interviewTime", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Interview Link */}
            <div className="space-y-2">
              <Label htmlFor="interviewLink" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                面试链接
              </Label>
              <Input
                id="interviewLink"
                type="url"
                placeholder="https://meeting.example.com/room/123"
                value={formData.interviewLink}
                onChange={(e) => handleInputChange("interviewLink", e.target.value)}
              />
            </div>

            {/* Round */}
            <div className="space-y-2">
              <Label htmlFor="round">面试轮次 *</Label>
              <Select value={formData.round} onValueChange={(value) => handleInputChange("round", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择面试轮次" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">第1轮 - 初试</SelectItem>
                  <SelectItem value="2">第2轮 - 复试</SelectItem>
                  <SelectItem value="3">第3轮 - 终试</SelectItem>
                  <SelectItem value="4">第4轮 - HR面试</SelectItem>
                  <SelectItem value="5">第5轮 - 其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                标签
              </Label>
              <Input
                id="tags"
                placeholder="例如：技术面试,前端,React"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
              />
              <p className="text-sm text-gray-500">多个标签请用逗号分隔</p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                备注
              </Label>
              <Textarea
                id="notes"
                placeholder="记录面试相关的备注信息..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "创建中..." : "创建面试安排"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/schedules">取消</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
