"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Briefcase, Building, Link as LinkIcon, MapPin, DollarSign, User } from "lucide-react"
import { toast } from "sonner"

const statusOptions = [
  { value: "applied", label: "已投递" },
  { value: "screening", label: "筛选中" },
  { value: "interview", label: "面试中" },
  { value: "offer", label: "已发offer" },
  { value: "rejected", label: "已拒绝" },
  { value: "withdrawn", label: "已撤回" },
]

const priorityOptions = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
  { value: "urgent", label: "紧急" },
]

export default function NewJobApplicationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    company: "",
    position: "",
    department: "",
    status: "applied",
    priority: "medium",
    appliedDate: "",
    jobUrl: "",
    jobDescription: "",
    isReferral: false,
    referrerName: "",
    salary: "",
    location: "",
    notes: "",
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      toast.error("请先登录")
      return
    }
    if (!formData.company || !formData.position) {
      toast.error("请填写公司与职位")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/job-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) {
        throw new Error("创建失败")
      }
      toast.success("岗位投递创建成功！")
      router.push("/schedules")
    } catch (error) {
      console.error("Create job application error:", error)
      toast.error("创建失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可创建岗位投递</p>
          <Button asChild>
            <Link href="/auth/signin">立即登录</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/schedules">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">新建岗位投递</h1>
          <p className="text-gray-600 mt-1">只创建岗位投递，不创建面试日程</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>岗位信息</CardTitle>
          <CardDescription>请填写岗位基础信息，* 为必填</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building className="w-4 h-4" /> 公司名称 *
                </Label>
                <Input
                  id="company"
                  placeholder="例如：腾讯"
                  value={formData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> 职位 *
                </Label>
                <Input
                  id="position"
                  placeholder="例如：前端开发工程师"
                  value={formData.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">部门</Label>
                <Input
                  id="department"
                  placeholder="例如：技术部"
                  value={formData.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appliedDate">投递日期</Label>
                <Input
                  id="appliedDate"
                  type="date"
                  value={formData.appliedDate}
                  onChange={(e) => handleChange("appliedDate", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">优先级</Label>
                <Select value={formData.priority} onValueChange={(v) => handleChange("priority", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobUrl" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" /> 职位链接
                </Label>
                <Input
                  id="jobUrl"
                  type="url"
                  placeholder="https://jobs.example.com/xxx"
                  value={formData.jobUrl}
                  onChange={(e) => handleChange("jobUrl", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> 工作地点
                </Label>
                <Input
                  id="location"
                  placeholder="例如：深圳"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> 薪资范围
                </Label>
                <Input
                  id="salary"
                  placeholder="例如：25k-35k*16"
                  value={formData.salary}
                  onChange={(e) => handleChange("salary", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    id="isReferral"
                    type="checkbox"
                    className="rounded"
                    checked={formData.isReferral}
                    onChange={(e) => handleChange("isReferral", e.target.checked)}
                  />
                  <Label htmlFor="isReferral" className="flex items-center gap-2">
                    <User className="w-4 h-4" /> 内推
                  </Label>
                </div>
                <Input
                  id="referrerName"
                  placeholder="内推人姓名（可选）"
                  value={formData.referrerName}
                  onChange={(e) => handleChange("referrerName", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobDescription">工作介绍</Label>
              <Textarea
                id="jobDescription"
                rows={4}
                placeholder="可以粘贴JD文本，便于后续参考"
                value={formData.jobDescription}
                onChange={(e) => handleChange("jobDescription", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="其他补充信息"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "创建中..." : "创建岗位投递"}
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


