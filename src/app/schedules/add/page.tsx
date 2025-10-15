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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, Building, Briefcase, Users, Link as LinkIcon, Tag, FileText, Check, X, Mail, Sparkles } from "lucide-react"
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

export default function AddSchedulePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([])
  const [matchedApplications, setMatchedApplications] = useState<JobApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [showJobSelection, setShowJobSelection] = useState(false)
  
  // 手动添加表单数据
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

  // 智能添加相关状态
  const [emailContent, setEmailContent] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<{
    company: string
    position: string
    department?: string
    interviewDate: string
    interviewLink?: string
    round: number
    tags?: string
    notes?: string
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<{
    company: string
    position: string
    department: string
    interviewDate: string
    interviewLink: string
    round: string
    tags: string
    notes: string
  }>({
    company: "",
    position: "",
    department: "",
    interviewDate: "",
    interviewLink: "",
    round: "",
    tags: "",
    notes: ""
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

  // 手动添加相关函数
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

  const handleSkipJobSelection = () => {
    setShowJobSelection(false)
    setSelectedApplication(null)
    setFormData(prev => ({ ...prev, jobApplicationId: "" }))
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
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

  // 智能添加相关函数
  const handleParseEmail = async () => {
    if (!emailContent.trim()) {
      toast.error("请输入邮件内容")
      return
    }

    setIsParsing(true)
    
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "parse-email",
          data: emailContent
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const data = result.data
        if (!data.round || data.round === 0) {
          data.round = 1
        }
        setParsedData(data)
        setEditData({
          company: data.company || "",
          position: data.position || "",
          department: data.department || "",
          interviewDate: data.interviewDate ? new Date(data.interviewDate).toISOString().slice(0, 16) : "",
          interviewLink: data.interviewLink || "",
          round: data.round ? data.round.toString() : "1",
          tags: data.tags || "",
          notes: data.notes || ""
        })
        toast.success("邮件解析成功！")
      } else {
        toast.error("解析失败，请重试")
      }
    } catch (error) {
      console.error("Parse email error:", error)
      toast.error("解析失败，请重试")
    } finally {
      setIsParsing(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (parsedData) {
      setEditData({
        company: parsedData.company || "",
        position: parsedData.position || "",
        department: parsedData.department || "",
        interviewDate: parsedData.interviewDate ? new Date(parsedData.interviewDate).toISOString().slice(0, 16) : "",
        interviewLink: parsedData.interviewLink || "",
        round: parsedData.round ? parsedData.round.toString() : "1",
        tags: parsedData.tags || "",
        notes: parsedData.notes || ""
      })
    }
  }

  const handleSaveEdit = () => {
    const updatedData = {
      company: editData.company,
      position: editData.position,
      department: editData.department || undefined,
      interviewDate: editData.interviewDate ? new Date(editData.interviewDate).toISOString() : new Date().toISOString(),
      interviewLink: editData.interviewLink || undefined,
      round: parseInt(editData.round) || 1,
      tags: editData.tags || undefined,
      notes: editData.notes || undefined
    }
    setParsedData(updatedData)
    setIsEditing(false)
    toast.success("修改已保存")
  }

  const handleSaveSchedule = async () => {
    if (!parsedData) return

    setIsSaving(true)
    
    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedData),
      })

      if (response.ok) {
        toast.success("面试安排创建成功！")
        router.push("/schedules")
      } else {
        toast.error("保存失败，请重试")
      }
    } catch (error) {
      console.error("Save schedule error:", error)
      toast.error("保存失败，请重试")
    } finally {
      setIsSaving(false)
    }
  }

  const sampleEmail = `主题：腾讯前端开发工程师面试邀请

亲爱的张三，

感谢您对我们前端开发工程师职位的关注。经过初步筛选，我们很荣幸地邀请您参加面试。

面试详情：
- 公司：腾讯
- 职位：前端开发工程师  
- 部门：技术部
- 面试时间：2024年1月15日 14:00
- 面试链接：https://meeting.tencent.com/room/123456
- 面试轮次：第1轮技术面试
- 面试官：李工程师

请提前10分钟进入会议室，准备好您的简历和相关作品。

如有任何问题，请随时联系我们。

祝好！
腾讯HR团队`

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
    <div className="max-w-7xl mx-auto space-y-6 px-4">
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
          <p className="text-gray-600 mt-1">选择智能添加或手动添加方式创建面试安排</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="smart" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="smart" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            智能添加
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            手动添加
          </TabsTrigger>
        </TabsList>

        {/* 智能添加 Tab */}
        <TabsContent value="smart" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 邮件输入区域 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  邮件内容
                </CardTitle>
                <CardDescription>
                  复制粘贴面试邀请邮件，AI将自动解析关键信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailContent">邮件全文</Label>
                  <Textarea
                    id="emailContent"
                    placeholder="请粘贴面试邀请邮件内容..."
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleParseEmail} 
                    disabled={isParsing || !emailContent.trim()}
                    className="flex-1"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isParsing ? "AI解析中..." : "AI智能解析"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEmailContent(sampleEmail)}
                  >
                    示例邮件
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 解析结果区域 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  解析结果
                </CardTitle>
                <CardDescription>
                  AI解析出的面试安排信息
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!parsedData ? (
                  <div className="text-center py-12 text-gray-500">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>请输入邮件内容并点击解析</p>
                    <p className="text-sm">AI将自动提取面试信息</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!isEditing ? (
                      <>
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">解析结果</h3>
                          <Button variant="outline" size="sm" onClick={handleEdit}>
                            编辑
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">公司：</span>
                            <span>{parsedData.company}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-green-600" />
                            <span className="font-medium">职位：</span>
                            <span>{parsedData.position}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">部门：</span>
                            <span>{parsedData.department || "未指定"}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-600" />
                            <span className="font-medium">时间：</span>
                            <span>{new Date(parsedData.interviewDate).toLocaleString('zh-CN')}</span>
                          </div>
                          
                          {parsedData.interviewLink && (
                            <div className="flex items-center gap-2">
                              <LinkIcon className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">链接：</span>
                              <a 
                                href={parsedData.interviewLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                查看面试链接
                              </a>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-red-600" />
                            <span className="font-medium">轮次：</span>
                            <span>第{parsedData.round || "未知"}轮</span>
                          </div>
                          
                          {parsedData.tags && (
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-600" />
                              <span className="font-medium">标签：</span>
                              <span>{parsedData.tags}</span>
                            </div>
                          )}
                          
                          {parsedData.notes && (
                            <div>
                              <span className="font-medium">备注：</span>
                              <p className="text-sm text-gray-600 mt-1">{parsedData.notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t">
                          <Button 
                            onClick={handleSaveSchedule} 
                            disabled={isSaving}
                            className="w-full"
                          >
                            {isSaving ? "保存中..." : "创建面试安排"}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">编辑信息</h3>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                              取消
                            </Button>
                            <Button size="sm" onClick={handleSaveEdit}>
                              保存
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-company">公司</Label>
                            <Input
                              id="edit-company"
                              value={editData.company}
                              onChange={(e) => setEditData({...editData, company: e.target.value})}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-position">职位</Label>
                            <Input
                              id="edit-position"
                              value={editData.position}
                              onChange={(e) => setEditData({...editData, position: e.target.value})}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-department">部门</Label>
                            <Input
                              id="edit-department"
                              value={editData.department}
                              onChange={(e) => setEditData({...editData, department: e.target.value})}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-date">面试时间</Label>
                            <Input
                              id="edit-date"
                              type="datetime-local"
                              value={editData.interviewDate}
                              onChange={(e) => setEditData({...editData, interviewDate: e.target.value})}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-link">面试链接</Label>
                            <Input
                              id="edit-link"
                              type="url"
                              value={editData.interviewLink}
                              onChange={(e) => setEditData({...editData, interviewLink: e.target.value})}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-round">轮次</Label>
                            <Input
                              id="edit-round"
                              type="number"
                              min="1"
                              value={editData.round}
                              onChange={(e) => setEditData({...editData, round: e.target.value})}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-tags">标签</Label>
                            <Input
                              id="edit-tags"
                              value={editData.tags}
                              onChange={(e) => setEditData({...editData, tags: e.target.value})}
                              placeholder="用逗号分隔多个标签"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-notes">备注</Label>
                            <Textarea
                              id="edit-notes"
                              value={editData.notes}
                              onChange={(e) => setEditData({...editData, notes: e.target.value})}
                              rows={3}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 手动添加 Tab */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>面试信息</CardTitle>
              <CardDescription>
                请填写完整的面试信息，所有带 * 的字段为必填项
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-6">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
