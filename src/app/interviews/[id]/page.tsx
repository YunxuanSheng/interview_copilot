"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  MessageSquare,
  Mic,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Clock,
  AlertTriangle,
  Plus
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { SmartTextRenderer } from "@/components/smart-text-renderer"

interface InterviewRecord {
  id: string
  scheduleId: string
  audioFilePath?: string
  transcript?: string
  aiAnalysis?: string
  overallScore?: number
  feedback?: string
  createdAt: string
  updatedAt?: string
  schedule: {
    company: string
    position: string
    interviewDate: string
    round: number
  }
  questions: {
    id: string
    questionText: string
    userAnswer?: string
    aiEvaluation?: string
    score?: number
    questionType?: string
  }[]
}

interface AIAnalysis {
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

const questionTypes = [
  { value: "algorithm", label: "算法题", color: "bg-blue-100 text-blue-800" },
  { value: "system_design", label: "系统设计", color: "bg-green-100 text-green-800" },
  { value: "behavioral", label: "行为面试", color: "bg-purple-100 text-purple-800" },
  { value: "technical", label: "技术问题", color: "bg-orange-100 text-orange-800" }
]


export default function InterviewDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const _router = useRouter()
  const [record, setRecord] = useState<InterviewRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    feedback: ""
  })

  const fetchRecord = useCallback(async () => {
    try {
      const response = await fetch(`/api/interviews/${params.id}`)
      if (!response.ok) {
        throw new Error("获取面试记录失败")
      }
      const data = await response.json()
      setRecord(data)
      setEditForm({
        feedback: data.feedback || ""
      })
      
      // 解析AI分析数据
      if (data.aiAnalysis) {
        try {
          const analysis = JSON.parse(data.aiAnalysis)
          setAiAnalysis(analysis)
        } catch (e) {
          console.error("Failed to parse AI analysis:", e)
        }
      }
    } catch (error) {
      console.error("Failed to fetch interview record:", error)
      setError("获取面试记录失败")
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (session && params.id) {
      fetchRecord()
    }
  }, [session, params.id, fetchRecord])

  const handleSave = async () => {
    if (!record) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/interviews/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error("保存失败")
      }

      const updatedRecord = await response.json()
      setRecord(updatedRecord)
      setIsEditing(false)
      setError("")
    } catch (error) {
      console.error("Failed to save interview record:", error)
      setError("保存失败，请重试")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (record) {
      setEditForm({
        feedback: record.feedback || ""
      })
    }
    setIsEditing(false)
    setError("")
  }

  const getQuestionTypeInfo = (type: string) => {
    return questionTypes.find(t => t.value === type) || questionTypes[3]
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可查看面试记录详情</p>
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
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">加载失败</h2>
          <p className="text-gray-600 mb-6">{error || "面试记录不存在或已被删除"}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => fetchRecord()}>重试</Button>
            <Button asChild variant="outline">
              <Link href="/interviews">返回面试记录</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center">
        <Button asChild variant="outline" size="sm">
          <Link href="/interviews">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回面试记录
          </Link>
        </Button>
      </div>

      {/* 标题区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {record.schedule.company}
          </h1>
          <p className="text-xl text-gray-600 mb-1">{record.schedule.position}</p>
          <p className="text-sm text-gray-500">第{record.schedule.round}轮面试</p>
        </div>
        
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button asChild>
                <Link href={`/interviews/${params.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  编辑面试记录
                </Link>
              </Button>
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                编辑反馈
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "保存中..." : "保存"}
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="w-4 h-4 mr-2" />
                取消
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* 概念介绍卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            需要了解的核心概念
          </CardTitle>
          <CardDescription>
            AI根据面试内容分析出的关键知识点
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">技术概念</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Spring框架核心特性（IoC、AOP、依赖注入）</li>
                <li>• 微服务架构设计原则</li>
                <li>• 数据库性能优化策略</li>
                <li>• 缓存机制和Redis应用</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">面试技巧</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• STAR方法回答行为问题</li>
                <li>• 结合项目经验说明技术点</li>
                <li>• 主动提及技术细节和实现方案</li>
                <li>• 展示问题分析和解决能力</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* AI分析结果 */}
      {aiAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 优点 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                优点
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {aiAnalysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 不足 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                不足
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {aiAnalysis.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 建议 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Lightbulb className="w-5 h-5" />
                建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {aiAnalysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 面试内容标签页 */}
      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="questions">面试题目</TabsTrigger>
          <TabsTrigger value="transcript">面试记录</TabsTrigger>
          <TabsTrigger value="feedback">反馈评价</TabsTrigger>
        </TabsList>

        {/* 面试题目 */}
        <TabsContent value="questions" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">面试题目</h3>
            <Button asChild variant="outline" size="sm">
              <Link href="/experiences/new">
                <Plus className="w-4 h-4 mr-2" />
                一键导入我的面经
              </Link>
            </Button>
          </div>
          
          {record.questions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500 mb-4">暂无面试题目记录</p>
                <Button asChild variant="outline">
                  <Link href="/experiences/new">
                    <Plus className="w-4 h-4 mr-2" />
                    添加题目到我的面经
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            record.questions.map((question, index) => {
              const typeInfo = getQuestionTypeInfo(question.questionType || "technical")
              return (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">题目 {index + 1}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/experiences/new?question=${encodeURIComponent(question.questionText)}&answer=${encodeURIComponent(question.userAnswer || '')}&type=${question.questionType || 'technical'}`}>
                            <Plus className="w-3 h-3 mr-1" />
                            导入我的面经
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">问题</Label>
                      <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                        {question.questionText}
                      </p>
                    </div>
                    
                    {question.userAnswer && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">我的回答</Label>
                        <div className="mt-1 text-gray-900">
                          <SmartTextRenderer text={question.userAnswer} />
                        </div>
                      </div>
                    )}
                    
                    {question.aiEvaluation && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">AI评价</Label>
                        <div className="mt-1 text-gray-700">
                          <SmartTextRenderer text={question.aiEvaluation} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* 面试记录 */}
        <TabsContent value="transcript">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                面试记录
              </CardTitle>
              <CardDescription>
                完整的面试对话记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              {record.transcript ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {record.transcript}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Mic className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>暂无面试记录</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 反馈评价 */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                反馈评价
              </CardTitle>
              <CardDescription>
                面试官反馈和AI分析总结
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="feedback">反馈内容</Label>
                    <Textarea
                      id="feedback"
                      value={editForm.feedback}
                      onChange={(e) => setEditForm(prev => ({ ...prev, feedback: e.target.value }))}
                      placeholder="请输入面试反馈..."
                      className="min-h-[200px] mt-2"
                    />
                  </div>
                </div>
              ) : (
                <div className="prose max-w-none">
                  {record.feedback ? (
                    <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {record.feedback}
                    </p>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>暂无反馈内容，点击编辑添加反馈</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 创建时间 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>创建时间: {format(new Date(record.createdAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}</span>
            {record.updatedAt && record.updatedAt !== record.createdAt && (
              <>
                <span>·</span>
                <span>更新时间: {format(new Date(record.updatedAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
