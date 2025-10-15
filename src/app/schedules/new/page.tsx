"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, Building, Briefcase, Users, Link as LinkIcon, Tag, FileText, Check, X } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface JobApplication {
  id: string
  company: string
  position: string
  department?: string
  status: string
  appliedDate: string
  jobUrl?: string
  notes?: string
}

export default function NewSchedulePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([])
  const [matchedApplications, setMatchedApplications] = useState<JobApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [showJobSelection, setShowJobSelection] = useState(false)
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    department: "",
    interviewDate: "",
    interviewTime: "",
    interviewLink: "",
    round: "1",
    tags: "",
    notes: "",
    jobApplicationId: ""
  })

  // 获取岗位投递数据
  useEffect(() => {
    if (session) {
      fetchJobApplications()
    }
  }, [session])

  // 处理URL参数
  useEffect(() => {
    const jobApplicationId = searchParams.get('jobApplicationId')
    if (jobApplicationId && jobApplications.length > 0) {
      const application = jobApplications.find(app => app.id === jobApplicationId)
      if (application) {
        setSelectedApplication(application)
        setFormData(prev => ({
          ...prev,
          company: application.company,
          position: application.position,
          department: application.department || "",
          jobApplicationId: application.id
        }))
      }
    }
  }, [searchParams, jobApplications])

  const fetchJobApplications = async () => {
    try {
      const response = await fetch("/api/job-applications")
      const data = await response.json()
      setJobApplications(data)
    } catch (error) {
      console.error("Failed to fetch job applications:", error)
    }
  }

  // 公司名匹配岗位
  const handleCompanyChange = (company: string) => {
    setFormData(prev => ({ ...prev, company }))
    
    if (company.trim()) {
      const matched = jobApplications.filter(app => 
        app.company.toLowerCase().includes(company.toLowerCase())
      )
      setMatchedApplications(matched)
      setShowJobSelection(matched.length > 0)
    } else {
      setMatchedApplications([])
      setShowJobSelection(false)
    }
  }

  // 选择匹配的岗位
  const handleSelectApplication = (application: JobApplication) => {
    setSelectedApplication(application)
    setFormData(prev => ({
      ...prev,
      company: application.company,
      position: application.position,
      department: application.department || "",
      jobApplicationId: application.id
    }))
    setShowJobSelection(false)
  }

  // 跳过岗位选择
  const handleSkipJobSelection = () => {
    setShowJobSelection(false)
    setSelectedApplication(null)
    setFormData(prev => ({ ...prev, jobApplicationId: "" }))
  }

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
          round: parseInt(formData.round),
          jobApplicationId: formData.jobApplicationId || null
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
                  onChange={(e) => handleCompanyChange(e.target.value)}
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

            {/* 岗位选择卡片 */}
            {showJobSelection && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    发现匹配的投递岗位
                  </CardTitle>
                  <CardDescription className="text-xs">
                    选择对应的岗位，或跳过此步骤
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {matchedApplications.map((application) => (
                    <div
                      key={application.id}
                      className="p-3 border rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleSelectApplication(application)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{application.position}</h4>
                          <p className="text-xs text-gray-600">{application.company}</p>
                          {application.department && (
                            <p className="text-xs text-gray-500">{application.department}</p>
                          )}
                        </div>
                        <Check className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSkipJobSelection}
                      className="flex-1"
                    >
                      <X className="w-3 h-3 mr-1" />
                      跳过
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 已选择的岗位 */}
            {selectedApplication && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    已关联岗位
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 border rounded-lg bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{selectedApplication.position}</h4>
                        <p className="text-xs text-gray-600">{selectedApplication.company}</p>
                        {selectedApplication.department && (
                          <p className="text-xs text-gray-500">{selectedApplication.department}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(null)
                          setFormData(prev => ({ ...prev, jobApplicationId: "" }))
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
