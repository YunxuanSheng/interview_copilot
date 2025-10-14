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
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Plus, Trash2, MessageSquare, Target } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface InterviewQuestion {
  id: string
  questionText: string
  userAnswer?: string
  aiEvaluation?: string
  questionType?: string
  score?: number
}

interface InterviewRecord {
  id: string
  scheduleId: string
  audioFilePath?: string
  transcript?: string
  aiAnalysis?: string
  feedback?: string
  createdAt: string
  schedule: {
    company: string
    position: string
    interviewDate: string
    round: number
  }
  questions: InterviewQuestion[]
}

export default function EditInterviewPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [record, setRecord] = useState<InterviewRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [transcript, setTranscript] = useState("")
  const [feedback, setFeedback] = useState("")

  const fetchRecord = useCallback(async () => {
    try {
      const response = await fetch(`/api/interviews/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setRecord(data)
        setQuestions(data.questions || [])
        setTranscript(data.transcript || "")
        setFeedback(data.feedback || "")
      } else {
        toast.error("获取面试记录失败")
        router.push("/interviews")
      }
    } catch (error) {
      console.error("Failed to fetch interview record:", error)
      toast.error("获取面试记录失败")
    } finally {
      setIsLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    if (session && params.id) {
      fetchRecord()
    }
  }, [session, params.id, fetchRecord])

  const handleQuestionChange = (index: number, field: keyof InterviewQuestion, value: string | number) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    }
    setQuestions(updatedQuestions)
  }

  const addQuestion = () => {
    const newQuestion: InterviewQuestion = {
      id: `temp-${Math.random().toString(36).substr(2, 9)}`,
      questionText: "",
      userAnswer: "",
      aiEvaluation: "",
      questionType: "technical",
      score: 0
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index)
    setQuestions(updatedQuestions)
  }

  const handleSave = async () => {
    if (!record) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/interviews/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          feedback,
          questions: questions.map(q => ({
            id: q.id.startsWith('temp-') ? undefined : q.id,
            questionText: q.questionText,
            userAnswer: q.userAnswer,
            aiEvaluation: q.aiEvaluation,
            questionType: q.questionType,
            score: q.score
          }))
        })
      })

      if (response.ok) {
        toast.success("面试记录已保存")
        router.push(`/interviews/${params.id}`)
      } else {
        toast.error("保存失败")
      }
    } catch (error) {
      console.error("Failed to save interview record:", error)
      toast.error("保存失败")
    } finally {
      setIsSaving(false)
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可编辑面试记录</p>
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

  if (!record) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">记录不存在</h2>
          <p className="text-gray-600 mb-6">该面试记录可能已被删除</p>
          <Button asChild>
            <Link href="/interviews">返回面试记录</Link>
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
          <Link href={`/interviews/${params.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">编辑面试记录</h1>
          <p className="text-gray-600 mt-1">
            {record.schedule.company} · {record.schedule.position} · 第{record.schedule.round}轮
          </p>
        </div>
      </div>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            面试记录
          </CardTitle>
          <CardDescription>
            编辑面试记录和反馈信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="transcript">面试记录</Label>
            <Textarea
              id="transcript"
              placeholder="输入面试记录..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
          
          <div>
            <Label htmlFor="feedback">面试反馈</Label>
            <Textarea
              id="feedback"
              placeholder="输入面试反馈..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* 面试问题 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                面试问题
              </CardTitle>
              <CardDescription>
                编辑面试问题和答案
              </CardDescription>
            </div>
            <Button onClick={addQuestion} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              添加问题
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无面试问题</p>
              <Button onClick={addQuestion} className="mt-4" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                添加第一个问题
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline">问题 {index + 1}</Badge>
                    <Button
                      onClick={() => removeQuestion(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`question-${index}`}>问题类型</Label>
                      <Select
                        value={question.questionType || "technical"}
                        onValueChange={(value) => handleQuestionChange(index, "questionType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择问题类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">技术问题</SelectItem>
                          <SelectItem value="behavioral">行为问题</SelectItem>
                          <SelectItem value="system_design">系统设计</SelectItem>
                          <SelectItem value="algorithm">算法问题</SelectItem>
                          <SelectItem value="other">其他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`score-${index}`}>评分 (1-10)</Label>
                      <Input
                        id={`score-${index}`}
                        type="number"
                        min="1"
                        max="10"
                        value={question.score || ""}
                        onChange={(e) => handleQuestionChange(index, "score", parseInt(e.target.value) || 0)}
                        placeholder="评分"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`questionText-${index}`}>问题内容</Label>
                    <Textarea
                      id={`questionText-${index}`}
                      placeholder="输入面试问题..."
                      value={question.questionText}
                      onChange={(e) => handleQuestionChange(index, "questionText", e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`userAnswer-${index}`}>我的回答</Label>
                    <Textarea
                      id={`userAnswer-${index}`}
                      placeholder="输入我的回答..."
                      value={question.userAnswer || ""}
                      onChange={(e) => handleQuestionChange(index, "userAnswer", e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`aiEvaluation-${index}`}>AI评价</Label>
                    <Textarea
                      id={`aiEvaluation-${index}`}
                      placeholder="AI评价..."
                      value={question.aiEvaluation || ""}
                      onChange={(e) => handleQuestionChange(index, "aiEvaluation", e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end gap-4">
        <Button asChild variant="outline">
          <Link href={`/interviews/${params.id}`}>取消</Link>
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "保存中..." : "保存更改"}
        </Button>
      </div>
    </div>
  )
}
