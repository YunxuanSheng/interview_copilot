"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  AlertCircle,
  Lightbulb,
  Clock,
  Plus,
  Share2
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { SmartTextRenderer } from "@/components/smart-text-renderer"
import { ProfessionalEvaluation } from "@/components/professional-evaluation"
import { MergedAnalysis } from "@/components/merged-analysis"
import { toast } from "sonner"

interface InterviewRecord {
  id: string
  scheduleId: string | null
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
  } | null
  questions: {
    id: string
    questionText: string
    userAnswer?: string
    aiEvaluation?: string
    recommendedAnswer?: string
    score?: number
    questionType?: string
    evaluation?: any
    difficulty?: string
  }[]
}

interface AIAnalysis {
  overallScore?: number
  strengths: Array<{
    category: string
    description: string
    evidence: string
  }>
  weaknesses: Array<{
    category: string
    description: string
    impact: string
    improvement: string
  }>
  suggestions: Array<{
    priority: string
    category: string
    suggestion: string
    actionable: string
  }>
  questionAnalysis?: Array<{
    question: string
    answer: string
    questionType: string
    difficulty: string
    evaluation: {
      technicalAccuracy: string
      completeness: string
      clarity: string
      depth: string
      specificFeedback: string
      missingPoints: string
      strengths: string
      improvements: string
    }
  }>
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
  const [importingIds, setImportingIds] = useState<string[]>([])

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
          let analysis: AIAnalysis | null = null
          
          if (typeof data.aiAnalysis === 'string') {
            // 尝试解析为 JSON
            try {
              analysis = JSON.parse(data.aiAnalysis)
              // 验证是否是有效的 AIAnalysis 对象（有 strengths/weaknesses/suggestions 等字段）
              if (analysis && typeof analysis === 'object' && 
                  ('strengths' in analysis || 'weaknesses' in analysis || 'suggestions' in analysis || 'questionAnalysis' in analysis)) {
                setAiAnalysis(analysis)
              } else {
                // 不是有效的 JSON 对象，可能是 Markdown 文本，设置为 null 使用 SmartTextRenderer 显示
                setAiAnalysis(null)
              }
            } catch {
              // JSON 解析失败，说明是 Markdown 文本格式，设置为 null 使用 SmartTextRenderer 显示
              setAiAnalysis(null)
            }
          } else if (typeof data.aiAnalysis === 'object') {
            // 直接是对象
            analysis = data.aiAnalysis
            if (analysis && ('strengths' in analysis || 'weaknesses' in analysis || 'suggestions' in analysis || 'questionAnalysis' in analysis)) {
              setAiAnalysis(analysis)
            } else {
              setAiAnalysis(null)
            }
          } else {
            setAiAnalysis(null)
          }
        } catch (error) {
          console.error("Failed to parse AI analysis:", error, data.aiAnalysis)
          // 解析失败，设置为 null，使用 SmartTextRenderer 显示原始文本
          setAiAnalysis(null)
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

  const importOneExperience = useCallback(async (q: { id: string; questionText: string; userAnswer?: string; questionType?: string; difficulty?: string }) => {
    if (!record) return
    try {
      setImportingIds(prev => [...prev, q.id])
      const payload = {
        company: record.schedule?.company || "未知公司",
        questionType: q.questionType || "technical",
        questionText: q.questionText,
        answerText: q.userAnswer || "",
        difficulty: q.difficulty || ""
      }
      const res = await fetch("/api/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        throw new Error("导入失败")
      }
      toast.success("已加入我的面经")
    } catch {
      toast.error("导入失败，请重试")
    } finally {
      setImportingIds(prev => prev.filter(id => id !== q.id))
    }
  }, [record])

  const importAllExperiences = useCallback(async () => {
    if (!record || !record.questions?.length) return
    try {
      const company = record.schedule?.company || "未知公司"
      const tasks = record.questions.map(q => {
        const payload = {
          company,
          questionType: q.questionType || "technical",
          questionText: q.questionText,
          answerText: q.userAnswer || "",
          difficulty: q.difficulty || ""
        }
        return fetch("/api/experiences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      })
      const results = await Promise.allSettled(tasks)
      const successCount = results.filter(r => r.status === "fulfilled").length
      if (successCount > 0) {
        toast.success(`已加入 ${successCount} 条到我的面经`)
      }
      const failCount = results.length - successCount
      if (failCount > 0) {
        toast.error(`${failCount} 条导入失败，请重试`)
      }
    } catch {
      toast.error("批量导入失败，请重试")
    }
  }, [record])

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
          {record.schedule ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {record.schedule.company}
              </h1>
              <p className="text-xl text-gray-600 mb-1">{record.schedule.position}</p>
              <p className="text-sm text-gray-500">第{record.schedule.round}轮面试</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                面试复盘
              </h1>
              <p className="text-xl text-gray-600 mb-1">未关联面试安排</p>
              <p className="text-sm text-gray-500">直接创建的复盘记录</p>
            </>
          )}
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
              <Button asChild variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                <Link href={`/interview-sharings/new?interviewRecordId=${params.id}`}>
                  <Share2 className="w-4 h-4 mr-2" />
                  发布面经
                </Link>
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

      {/* 主要内容区域（移除目录导航，简化为单列/响应式） */}
      <div className="space-y-6">
          {/* 概念介绍卡片 - 只在有AI分析时显示 */}
          {aiAnalysis && (aiAnalysis.strengths.length > 0 || aiAnalysis.weaknesses.length > 0 || aiAnalysis.suggestions.length > 0) && (
            <Card id="concepts">
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
          )}


          {/* 面试内容标签页 */}
          <Tabs defaultValue="questions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="questions">面试题目</TabsTrigger>
              <TabsTrigger value="transcript">面试记录</TabsTrigger>
              {aiAnalysis && (
                <TabsTrigger value="analysis">AI分析</TabsTrigger>
              )}
            </TabsList>

            {/* 面试题目 */}
            <TabsContent value="questions" className="space-y-4" id="questions">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">面试题目</h3>
                <Button variant="outline" size="sm" onClick={importAllExperiences}>
                  <Plus className="w-4 h-4 mr-2" />
                  一键全部加入
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
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => importOneExperience({
                                id: question.id,
                                questionText: question.questionText,
                                userAnswer: question.userAnswer,
                                questionType: question.questionType,
                                difficulty: question.difficulty
                              })}
                              disabled={importingIds.includes(question.id)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              {importingIds.includes(question.id) ? "导入中..." : "加入我的面经"}
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
                              {/* 优先按结构化JSON渲染，回退到纯文本 */}
                              {(() => {
                                try {
                                  const parsed = JSON.parse(question.aiEvaluation)
                                  if (parsed && typeof parsed === 'object') {
                                    return (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <div className="text-sm font-medium mb-1">技术准确性</div>
                                          <p className="text-sm text-gray-700">{parsed.technicalAccuracy}</p>
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium mb-1">回答完整性</div>
                                          <p className="text-sm text-gray-700">{parsed.completeness}</p>
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium mb-1">表达清晰度</div>
                                          <p className="text-sm text-gray-700">{parsed.clarity}</p>
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium mb-1">技术深度</div>
                                          <p className="text-sm text-gray-700">{parsed.depth}</p>
                                        </div>
                                        {parsed.specificFeedback && (
                                          <div className="md:col-span-2">
                                            <div className="text-sm font-medium mb-1">具体反馈</div>
                                            <p className="text-sm text-gray-700">{parsed.specificFeedback}</p>
                                          </div>
                                        )}
                                        {(parsed.missingPoints || parsed.strengths || parsed.improvements) && (
                                          <div className="md:col-span-2">
                                            <ProfessionalEvaluation evaluation={{
                                              technicalAccuracy: parsed.technicalAccuracy || '',
                                              completeness: parsed.completeness || '',
                                              clarity: parsed.clarity || '',
                                              depth: parsed.depth || '',
                                              specificFeedback: parsed.specificFeedback || '',
                                              missingPoints: parsed.missingPoints || '',
                                              strengths: parsed.strengths || '',
                                              improvements: parsed.improvements || ''
                                            }} />
                                          </div>
                                        )}
                                      </div>
                                    )
                                  }
                                } catch {}
                                return <SmartTextRenderer text={question.aiEvaluation} />
                              })()}
                            </div>
                          </div>
                        )}

                        {/* 专业评价 */}
                        {question.evaluation && (
                          <ProfessionalEvaluation 
                            evaluation={question.evaluation}
                            questionType={question.questionType}
                            difficulty={question.difficulty}
                          />
                        )}
                        
                        {/* 显示推荐答案 */}
                        {question.recommendedAnswer && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">AI推荐回答</Label>
                            <div className="mt-1 p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="text-gray-800 leading-relaxed">
                                <SmartTextRenderer text={question.recommendedAnswer} />
                              </div>
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
            <TabsContent value="transcript" id="transcript">
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
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-900 whitespace-pre-wrap">
                          {record.transcript.split('\n').map((line, index) => {
                            // 检查是否是说话人标识行
                            if (line.includes(':') && (line.includes('面试官') || line.includes('候选人'))) {
                              const [speaker, ...content] = line.split(':')
                              const isInterviewer = speaker.includes('面试官')
                              return (
                                <div key={index} className={`mb-3 p-3 rounded-lg ${
                                  isInterviewer 
                                    ? 'bg-blue-50 border-l-4 border-blue-400' 
                                    : 'bg-green-50 border-l-4 border-green-400'
                                }`}>
                                  <div className={`font-semibold text-sm mb-1 ${
                                    isInterviewer ? 'text-blue-800' : 'text-green-800'
                                  }`}>
                                    {speaker.trim()}
                                  </div>
                                  <div className="text-gray-800">
                                    {content.join(':').trim()}
                                  </div>
                                </div>
                              )
                            }
                            // 普通文本行
                            return (
                              <div key={index} className="mb-2 text-gray-700">
                                {line}
                              </div>
                            )
                          })}
                        </div>
                      </div>
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

            {/* AI分析 */}
            {(aiAnalysis || record.aiAnalysis) && (
              <TabsContent value="analysis" className="space-y-4" id="analysis">
                {aiAnalysis && aiAnalysis.strengths && aiAnalysis.strengths.length > 0 ? (
                  <MergedAnalysis analysis={aiAnalysis as any} />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        AI分析
                      </CardTitle>
                      <CardDescription>
                        AI对面试表现的分析和评价
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-900 whitespace-pre-wrap">
                            <SmartTextRenderer text={record.aiAnalysis || ""} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

          </Tabs>
      </div>

      {/* 底部信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* 面试基本信息 */}
        {record.schedule && (
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">公司:</span>
                  <span className="font-medium">{record.schedule.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">职位:</span>
                  <span className="font-medium">{record.schedule.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">轮次:</span>
                  <span className="font-medium">第{record.schedule.round}轮</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">面试日期:</span>
                  <span className="font-medium">
                    {format(new Date(record.schedule.interviewDate), "MM月dd日", { locale: zhCN })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
