"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Mail, Calendar, Upload, Save, Edit3, GraduationCap, Briefcase, Code, Plus, Trash2, FileText, Phone, MapPin, FolderOpen, CheckCircle, Clock, Sparkles, Download, AlertTriangle, Database } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface UserProfile {
  id: string
  email: string
  name?: string
  image?: string
  phone?: string
  location?: string
  summary?: string
  createdAt: string
  updatedAt: string
  educations: Education[]
  workExperiences: WorkExperience[]
  skills: Skill[]
  projects: Project[]
}

interface Project {
  id: string
  name: string
  role: string
  description: string
  timeRange?: string
  techStack?: string
  status: string
  createdAt: string
  updatedAt: string
  cards: ProjectCard[]
}

interface ProjectCard {
  id: string
  category: string
  question: string
  answer?: string
  status: string
  priority: number
}

interface Education {
  id: string
  school: string
  degree: string
  major?: string
  startDate: string
  endDate?: string
  description?: string
}

interface WorkExperience {
  id: string
  company: string
  position: string
  startDate: string
  endDate?: string
  description?: string
  achievements?: string
}

interface Skill {
  id: string
  name: string
  level: string
  category: string
}

interface AiUsageStats {
  interview_analysis: number
  audio_transcription: number
  suggestion_generation: number
  job_parsing: number
  total: number
}

interface CreditsStatus {
  creditsBalance: number
  dailyUsed: number
  monthlyUsed: number
  dailyRemaining: number
  monthlyRemaining: number
  dailyLimit: number
  monthlyLimit: number
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    summary: ""
  })
  const [educations, setEducations] = useState<Education[]>([])
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [aiUsageStats, setAiUsageStats] = useState<AiUsageStats>({
    interview_analysis: 0,
    audio_transcription: 0,
    suggestion_generation: 0,
    job_parsing: 0,
    total: 0
  })
  const [creditsStatus, setCreditsStatus] = useState<CreditsStatus>({
    creditsBalance: 0,
    dailyUsed: 0,
    monthlyUsed: 0,
    dailyRemaining: 0,
    monthlyRemaining: 0,
    dailyLimit: 200,
    monthlyLimit: 2000
  })
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (session) {
      fetchProfile()
      fetchAiUsageStats()
      fetchCreditsStatus()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          summary: data.summary || ""
        })
        setEducations(data.educations || [])
        setWorkExperiences(data.workExperiences || [])
        setSkills(data.skills || [])
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAiUsageStats = async () => {
    try {
      const response = await fetch("/api/ai-usage")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAiUsageStats(data.data)
        }
      }
    } catch (error) {
      console.error("Failed to fetch AI usage stats:", error)
    }
  }

  const fetchCreditsStatus = async () => {
    try {
      const response = await fetch("/api/credits")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCreditsStatus(data.data)
        }
      }
    } catch (error) {
      console.error("Failed to fetch credits status:", error)
    }
  }

  const handleAddCredits = async () => {
    try {
      const response = await fetch("/api/credits/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: 100 }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success("成功补充100 credits！")
          fetchCreditsStatus() // 刷新credits状态
        } else {
          toast.error(data.message || "补充credits失败")
        }
      } else {
        toast.error("补充credits失败")
      }
    } catch (error) {
      console.error("补充credits失败:", error)
      toast.error("补充credits失败")
    }
  }

  const handleResetTestCredits = async () => {
    try {
      const response = await fetch("/api/credits/reset-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success("测试credits已重置为2000！")
          fetchCreditsStatus() // 刷新credits状态
        } else {
          toast.error(data.message || "重置credits失败")
        }
      } else {
        toast.error("重置credits失败")
      }
    } catch (error) {
      console.error("重置credits失败:", error)
      toast.error("重置credits失败")
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/user/data-export")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // 创建下载链接
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { 
            type: 'application/json' 
          })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `interview-copilot-data-${new Date().toISOString().split('T')[0]}.json`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          
          toast.success("数据导出成功！")
        } else {
          toast.error("数据导出失败")
        }
      } else {
        toast.error("数据导出失败")
      }
    } catch (error) {
      console.error("数据导出失败:", error)
      toast.error("数据导出失败")
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteData = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/user/data-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success("数据删除成功！")
          // 重定向到登录页面
          window.location.href = "/auth/signin"
        } else {
          toast.error(data.message || "数据删除失败")
        }
      } else {
        toast.error("数据删除失败")
      }
    } catch (error) {
      console.error("数据删除失败:", error)
      toast.error("数据删除失败")
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          educations,
          workExperiences,
          skills
        }),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setIsEditing(false)
        toast.success("个人资料更新成功！")
        
        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            name: updatedProfile.name,
            email: updatedProfile.email
          }
        })
      } else {
        toast.error("更新失败，请重试")
      }
    } catch (error) {
      console.error("Update profile error:", error)
      toast.error("更新失败，请重试")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        summary: profile.summary || ""
      })
      setEducations(profile.educations || [])
      setWorkExperiences(profile.workExperiences || [])
      setSkills(profile.skills || [])
      setProjects(profile.projects || [])
    }
    setIsEditing(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      school: "",
      degree: "",
      major: "",
      startDate: "",
      endDate: "",
      description: ""
    }
    setEducations([...educations, newEducation])
  }

  const removeEducation = (id: string) => {
    setEducations(educations.filter(edu => edu.id !== id))
  }

  const updateEducation = (id: string, field: string, value: string) => {
    setEducations(educations.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ))
  }

  const addWorkExperience = () => {
    const newWork: WorkExperience = {
      id: Date.now().toString(),
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
      achievements: ""
    }
    setWorkExperiences([...workExperiences, newWork])
  }

  const removeWorkExperience = (id: string) => {
    setWorkExperiences(workExperiences.filter(work => work.id !== id))
  }

  const updateWorkExperience = (id: string, field: string, value: string) => {
    setWorkExperiences(workExperiences.map(work => 
      work.id === id ? { ...work, [field]: value } : work
    ))
  }

  const addSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: "",
      level: "intermediate",
      category: "technical"
    }
    setSkills([...skills, newSkill])
  }

  const removeSkill = (id: string) => {
    setSkills(skills.filter(skill => skill.id !== id))
  }

  const updateSkill = (id: string, field: string, value: string) => {
    setSkills(skills.map(skill => 
      skill.id === id ? { ...skill, [field]: value } : skill
    ))
  }

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case "expert": return "bg-red-100 text-red-800"
      case "advanced": return "bg-orange-100 text-orange-800"
      case "intermediate": return "bg-yellow-100 text-yellow-800"
      case "beginner": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
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
          <p className="text-gray-600 mb-6">登录后即可查看个人档案</p>
          <Button asChild>
            <Link href="/auth/signin">立即登录</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">个人档案</h1>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">个人档案</h1>
          <p className="text-gray-600 mt-1">管理您的个人信息和简历</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/profile/parse-resume">
              <FileText className="w-4 h-4 mr-2" />
              智能简历解析
            </Link>
          </Button>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="w-4 h-4 mr-2" />
              编辑资料
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="education">教育经历</TabsTrigger>
          <TabsTrigger value="work">工作经历</TabsTrigger>
          <TabsTrigger value="skills">技能专长</TabsTrigger>
          <TabsTrigger value="projects">项目整理</TabsTrigger>
          <TabsTrigger value="data-management">数据管理</TabsTrigger>
        </TabsList>

        {/* 基本信息 */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                基本信息
              </CardTitle>
              <CardDescription>
                您的个人基本信息和联系方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.image || session.user?.image || ""} />
                  <AvatarFallback className="text-lg">
                    {profile?.name?.charAt(0) || session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">
                    {profile?.name || session.user?.name || "用户"}
                  </h3>
                  <p className="text-gray-600">{profile?.email || session.user?.email}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Upload className="w-4 h-4 mr-2" />
                    更换头像
                  </Button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    姓名
                  </Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="请输入您的姓名"
                    />
                  ) : (
                    <div className="p-3 border rounded-md bg-gray-50">
                      {profile?.name || "未设置"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    邮箱
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="请输入您的邮箱"
                    />
                  ) : (
                    <div className="p-3 border rounded-md bg-gray-50">
                      {profile?.email || "未设置"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    电话
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="请输入您的电话"
                    />
                  ) : (
                    <div className="p-3 border rounded-md bg-gray-50">
                      {profile?.phone || "未设置"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    地址
                  </Label>
                  {isEditing ? (
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="请输入您的地址"
                    />
                  ) : (
                    <div className="p-3 border rounded-md bg-gray-50">
                      {profile?.location || "未设置"}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">个人简介</Label>
                {isEditing ? (
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => handleInputChange("summary", e.target.value)}
                    placeholder="请简要介绍您的背景和专长..."
                    rows={4}
                  />
                ) : (
                  <div className="p-3 border rounded-md bg-gray-50 min-h-[100px]">
                    {profile?.summary || "未设置"}
                  </div>
                )}
              </div>

              {/* Account Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    注册时间
                  </Label>
                  <div className="p-3 border rounded-md bg-gray-50">
                    {profile?.createdAt 
                      ? format(new Date(profile.createdAt), "yyyy年MM月dd日", { locale: zhCN })
                      : "未知"
                    }
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    最后更新
                  </Label>
                  <div className="p-3 border rounded-md bg-gray-50">
                    {profile?.updatedAt 
                      ? format(new Date(profile.updatedAt), "yyyy年MM月dd日", { locale: zhCN })
                      : "未知"
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credits状态 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Credits余额与限制
              </CardTitle>
              <CardDescription>
                您的AI服务使用额度管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Credits余额</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{creditsStatus.creditsBalance}</div>
                  <div className="text-sm text-blue-700">可用额度</div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">今日剩余</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{creditsStatus.dailyRemaining}</div>
                  <div className="text-sm text-green-700">/ {creditsStatus.dailyLimit} 每日限制</div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-900">本月剩余</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{creditsStatus.monthlyRemaining}</div>
                  <div className="text-sm text-purple-700">/ {creditsStatus.monthlyLimit} 每月限制</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">服务消耗说明</h4>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleResetTestCredits}
                      size="sm"
                      variant="default"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      重置测试2000 Credits
                    </Button>
                    <Button 
                      onClick={handleAddCredits}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      补充100 Credits
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">面试分析:</span>
                    <span className="font-medium">10 credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">音频转录:</span>
                    <span className="font-medium">5 credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">建议生成:</span>
                    <span className="font-medium">3 credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">岗位解析:</span>
                    <span className="font-medium">2 credits</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI使用统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI服务使用统计
              </CardTitle>
              <CardDescription>
                您使用各项AI服务的次数统计
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">面试分析</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{aiUsageStats.interview_analysis}</div>
                  <div className="text-sm text-blue-700">次使用</div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">音频转录</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{aiUsageStats.audio_transcription}</div>
                  <div className="text-sm text-green-700">次使用</div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-900">建议生成</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{aiUsageStats.suggestion_generation}</div>
                  <div className="text-sm text-purple-700">次使用</div>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-orange-900">岗位解析</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{aiUsageStats.job_parsing}</div>
                  <div className="text-sm text-orange-700">次使用</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">总使用次数</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{aiUsageStats.total}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 教育经历 */}
        <TabsContent value="education" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  教育经历
                </div>
                {isEditing && (
                  <Button onClick={addEducation} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    添加教育经历
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                您的教育背景和学习经历
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {educations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无教育经历</p>
                  {isEditing && (
                    <Button onClick={addEducation} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      添加教育经历
                    </Button>
                  )}
                </div>
              ) : (
                educations.map((education, index) => (
                  <div key={education.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">教育经历 {index + 1}</h4>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEducation(education.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>学校名称</Label>
                        {isEditing ? (
                          <Input
                            value={education.school}
                            onChange={(e) => updateEducation(education.id, "school", e.target.value)}
                            placeholder="请输入学校名称"
                          />
                        ) : (
                          <div className="p-2 border rounded bg-gray-50">{education.school || "未设置"}</div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>学位</Label>
                        {isEditing ? (
                          <Input
                            value={education.degree}
                            onChange={(e) => updateEducation(education.id, "degree", e.target.value)}
                            placeholder="请输入学位"
                          />
                        ) : (
                          <div className="p-2 border rounded bg-gray-50">{education.degree || "未设置"}</div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>专业</Label>
                        {isEditing ? (
                          <Input
                            value={education.major || ""}
                            onChange={(e) => updateEducation(education.id, "major", e.target.value)}
                            placeholder="请输入专业"
                          />
                        ) : (
                          <div className="p-2 border rounded bg-gray-50">{education.major || "未设置"}</div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>时间</Label>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Input
                              type="month"
                              value={education.startDate}
                              onChange={(e) => updateEducation(education.id, "startDate", e.target.value)}
                            />
                            <Input
                              type="month"
                              value={education.endDate || ""}
                              onChange={(e) => updateEducation(education.id, "endDate", e.target.value)}
                              placeholder="结束时间"
                            />
                          </div>
                        ) : (
                          <div className="p-2 border rounded bg-gray-50">
                            {education.startDate} - {education.endDate || "至今"}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>描述</Label>
                      {isEditing ? (
                        <Textarea
                          value={education.description || ""}
                          onChange={(e) => updateEducation(education.id, "description", e.target.value)}
                          placeholder="请输入相关描述..."
                          rows={2}
                        />
                      ) : (
                        <div className="p-2 border rounded bg-gray-50 min-h-[50px]">
                          {education.description || "未设置"}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 工作经历 */}
        <TabsContent value="work" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  工作经历
                </div>
                {isEditing && (
                  <Button onClick={addWorkExperience} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    添加工作经历
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                您的工作经验和职业发展
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workExperiences.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无工作经历</p>
                  {isEditing && (
                    <Button onClick={addWorkExperience} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      添加工作经历
                    </Button>
                  )}
                </div>
              ) : (
                workExperiences.map((work, index) => (
                  <div key={work.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">工作经历 {index + 1}</h4>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWorkExperience(work.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>公司名称</Label>
                        {isEditing ? (
                          <Input
                            value={work.company}
                            onChange={(e) => updateWorkExperience(work.id, "company", e.target.value)}
                            placeholder="请输入公司名称"
                          />
                        ) : (
                          <div className="p-2 border rounded bg-gray-50">{work.company || "未设置"}</div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>职位</Label>
                        {isEditing ? (
                          <Input
                            value={work.position}
                            onChange={(e) => updateWorkExperience(work.id, "position", e.target.value)}
                            placeholder="请输入职位"
                          />
                        ) : (
                          <div className="p-2 border rounded bg-gray-50">{work.position || "未设置"}</div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>时间</Label>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Input
                              type="month"
                              value={work.startDate}
                              onChange={(e) => updateWorkExperience(work.id, "startDate", e.target.value)}
                            />
                            <Input
                              type="month"
                              value={work.endDate || ""}
                              onChange={(e) => updateWorkExperience(work.id, "endDate", e.target.value)}
                              placeholder="结束时间"
                            />
                          </div>
                        ) : (
                          <div className="p-2 border rounded bg-gray-50">
                            {work.startDate} - {work.endDate || "至今"}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>工作描述</Label>
                      {isEditing ? (
                        <Textarea
                          value={work.description || ""}
                          onChange={(e) => updateWorkExperience(work.id, "description", e.target.value)}
                          placeholder="请描述您的工作内容和职责..."
                          rows={3}
                        />
                      ) : (
                        <div className="p-2 border rounded bg-gray-50 min-h-[75px]">
                          {work.description || "未设置"}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>主要成就</Label>
                      {isEditing ? (
                        <Textarea
                          value={work.achievements || ""}
                          onChange={(e) => updateWorkExperience(work.id, "achievements", e.target.value)}
                          placeholder="请描述您的主要成就和贡献..."
                          rows={2}
                        />
                      ) : (
                        <div className="p-2 border rounded bg-gray-50 min-h-[50px]">
                          {work.achievements || "未设置"}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 技能专长 */}
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  技能专长
                </div>
                {isEditing && (
                  <Button onClick={addSkill} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    添加技能
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                您的技术技能和专业能力
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Code className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无技能信息</p>
                  {isEditing && (
                    <Button onClick={addSkill} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      添加技能
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skills.map((skill, index) => (
                    <div key={skill.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">技能 {index + 1}</h4>
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSkill(skill.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>技能名称</Label>
                        {isEditing ? (
                          <Input
                            value={skill.name}
                            onChange={(e) => updateSkill(skill.id, "name", e.target.value)}
                            placeholder="请输入技能名称"
                          />
                        ) : (
                          <div className="p-2 border rounded bg-gray-50">{skill.name || "未设置"}</div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>熟练程度</Label>
                          {isEditing ? (
                            <Select
                              value={skill.level}
                              onValueChange={(value) => updateSkill(skill.id, "level", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="beginner">初级</SelectItem>
                                <SelectItem value="intermediate">中级</SelectItem>
                                <SelectItem value="advanced">高级</SelectItem>
                                <SelectItem value="expert">专家</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="p-2 border rounded bg-gray-50">
                              {skill.level === "beginner" ? "初级" :
                               skill.level === "intermediate" ? "中级" :
                               skill.level === "advanced" ? "高级" : "专家"}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label>分类</Label>
                          {isEditing ? (
                            <Select
                              value={skill.category}
                              onValueChange={(value) => updateSkill(skill.id, "category", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="technical">技术技能</SelectItem>
                                <SelectItem value="language">语言能力</SelectItem>
                                <SelectItem value="soft_skill">软技能</SelectItem>
                                <SelectItem value="tool">工具使用</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="p-2 border rounded bg-gray-50">
                              {skill.category === "technical" ? "技术技能" :
                               skill.category === "language" ? "语言能力" :
                               skill.category === "soft_skill" ? "软技能" : "工具使用"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 技能标签展示 */}
              {skills.length > 0 && !isEditing && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">技能标签</h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span 
                        key={skill.id}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getSkillLevelColor(skill.level)}`}
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 项目整理 */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  项目整理
                </div>
                <Button asChild>
                  <Link href="/projects">
                    <Plus className="w-4 h-4 mr-2" />
                    管理项目
                  </Link>
                </Button>
              </CardTitle>
              <CardDescription>
                您的项目语料库和面试准备情况
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无项目</p>
                  <Button asChild className="mt-4">
                    <Link href="/projects/new">
                      <Plus className="w-4 h-4 mr-2" />
                      创建第一个项目
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 项目统计概览 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FolderOpen className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900">总项目数</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-900">已完成卡片</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {projects.reduce((total, project) => 
                          total + project.cards.filter(card => card.status === "completed").length, 0
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-900">草稿卡片</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {projects.reduce((total, project) => 
                          total + project.cards.filter(card => card.status === "draft").length, 0
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-900">总卡片数</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {projects.reduce((total, project) => total + project.cards.length, 0)}
                      </div>
                    </div>
                  </div>

                  {/* 项目列表 */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">最近项目</h4>
                    {projects.slice(0, 3).map((project) => {
                      const completedCards = project.cards.filter(card => card.status === "completed").length
                      const totalCards = project.cards.length
                      const completionRate = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0
                      
                      return (
                        <div key={project.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-medium text-gray-900">{project.name}</h5>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary">{project.role}</Badge>
                                {project.timeRange && (
                                  <span className="text-sm text-gray-600">{project.timeRange}</span>
                                )}
                              </div>
                            </div>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/projects/${project.id}`}>
                                查看详情
                              </Link>
                            </Button>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {project.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{totalCards} 卡片</span>
                              <span className="text-green-600">{completedCards} 完成</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${completionRate}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{completionRate}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    
                    {projects.length > 3 && (
                      <div className="text-center">
                        <Button asChild variant="outline">
                          <Link href="/projects">
                            查看所有项目
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 数据管理 */}
        <TabsContent value="data-management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                数据管理
              </CardTitle>
              <CardDescription>
                管理您的个人数据，包括导出和删除功能
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 数据导出 */}
              <div className="p-6 border rounded-lg bg-blue-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-blue-900 mb-2">数据导出</h3>
                    <p className="text-blue-700 mb-4">
                      导出您的所有个人数据，包括个人资料、面试记录、项目信息等。数据将以JSON格式下载。
                    </p>
                    <div className="text-sm text-blue-600">
                      <p>• 个人基本信息和联系方式</p>
                      <p>• 教育经历和工作经历</p>
                      <p>• 技能专长和项目整理</p>
                      <p>• 面试记录和面经分享</p>
                      <p>• AI使用统计和积分信息</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="ml-4"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? "导出中..." : "导出数据"}
                  </Button>
                </div>
              </div>

              {/* 数据删除 */}
              <div className="p-6 border rounded-lg bg-red-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-red-900 mb-2">数据删除</h3>
                    <p className="text-red-700 mb-4">
                      永久删除您的所有个人数据。此操作不可撤销，请谨慎操作。
                    </p>
                    <div className="text-sm text-red-600">
                      <p>• 将删除所有个人资料和设置</p>
                      <p>• 将删除所有面试记录和面经</p>
                      <p>• 将删除所有项目和技能信息</p>
                      <p>• 将删除所有AI使用记录</p>
                      <p>• 删除后需要重新注册才能使用服务</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    variant="destructive"
                    className="ml-4"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? "删除中..." : "删除数据"}
                  </Button>
                </div>
              </div>

              {/* 数据统计 */}
              <div className="p-6 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">数据统计</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
                    <div className="text-sm text-gray-600">项目数量</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{aiUsageStats.total}</div>
                    <div className="text-sm text-gray-600">AI使用次数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{creditsStatus.creditsBalance}</div>
                    <div className="text-sm text-gray-600">剩余积分</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">确认删除数据</h3>
            </div>
            <p className="text-gray-600 mb-6">
              您确定要永久删除所有个人数据吗？此操作不可撤销，删除后您需要重新注册才能使用服务。
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={handleDeleteData}
                disabled={isDeleting}
                variant="destructive"
                className="flex-1"
              >
                {isDeleting ? "删除中..." : "确认删除"}
              </Button>
              <Button 
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isEditing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "保存中..." : "保存更改"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}