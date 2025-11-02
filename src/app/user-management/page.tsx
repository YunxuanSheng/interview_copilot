"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle, 
  Clock, 
  Calendar, 
  Plus, 
  Sparkles, 
  FileText, 
  Briefcase,
  Database,
  Download,
  Trash2,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

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

export default function UserManagementPage() {
  const { data: session, status } = useSession()
  const [creditsStatus, setCreditsStatus] = useState<CreditsStatus>({
    creditsBalance: 0,
    dailyUsed: 0,
    monthlyUsed: 0,
    dailyRemaining: 0,
    monthlyRemaining: 0,
    dailyLimit: 200,
    monthlyLimit: 2000
  })
  const [aiUsageStats, setAiUsageStats] = useState<AiUsageStats>({
    interview_analysis: 0,
    audio_transcription: 0,
    suggestion_generation: 0,
    job_parsing: 0,
    total: 0
  })
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [projectsCount, setProjectsCount] = useState(0)

  useEffect(() => {
    if (session) {
      fetchCreditsStatus()
      fetchAiUsageStats()
      fetchProjectsCount()
    }
  }, [session])

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

  const fetchProjectsCount = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProjectsCount(data.data?.length || 0)
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects count:", error)
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
          fetchCreditsStatus()
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
          fetchCreditsStatus()
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
          <p className="text-gray-600 mb-6">登录后即可查看用户管理</p>
          <Button asChild>
            <Link href="/auth/signin">立即登录</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-600 mt-1">管理您的账号、Credits 和数据</p>
        </div>
      </div>

      <Tabs defaultValue="credits" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="credits">Credits 管理</TabsTrigger>
          <TabsTrigger value="ai-stats">AI 使用统计</TabsTrigger>
          <TabsTrigger value="data-management">账号数据处理</TabsTrigger>
        </TabsList>

        {/* Credits 管理 */}
        <TabsContent value="credits" className="space-y-6">
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
        </TabsContent>

        {/* AI 使用统计 */}
        <TabsContent value="ai-stats" className="space-y-6">
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

        {/* 账号数据处理 */}
        <TabsContent value="data-management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                账号数据处理
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
                    <div className="text-2xl font-bold text-blue-600">{projectsCount}</div>
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
    </div>
  )
}

