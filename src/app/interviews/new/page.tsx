"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useAnalytics } from "@/hooks/useAnalytics"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Calendar, Building, FileText, Plus, Mic, Upload, Sparkles, Edit, X } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { QuestionDisplay } from "@/components/question-display"

interface Schedule {
  id: string
  company: string
  position: string
  interviewDate: string
  round: number
}

interface Question {
  id: string
  questionText: string
  userAnswer: string
  aiEvaluation: string
  recommendedAnswer?: string
  questionType: string
  difficulty?: string
  priority?: string
}

export default function NewInterviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { trackFeatureUse, trackButtonClick } = useAnalytics()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>("")
  const [_analysis, setAnalysis] = useState<{
    questionAnalysis: Array<{
      question: string
      answer: string
      evaluation: string
    }>
    suggestions: string[]
  } | null>(null)
  const [formData, setFormData] = useState({
    scheduleId: "",
    transcript: "",
    aiAnalysis: "",
    feedback: ""
  })
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [quickCreateData, setQuickCreateData] = useState({
    company: "",
    position: "",
    department: "",
    interviewDate: "",
    round: 1
  })
  const [questions, setQuestions] = useState<Question[]>([])
  const [isEditingAiAnalysis, setIsEditingAiAnalysis] = useState(false)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [showNextStepDialog, setShowNextStepDialog] = useState(false)

  useEffect(() => {
    if (session) {
      fetchSchedules()
    }
  }, [session])

  // 从URL参数中获取transcript和taskId
  useEffect(() => {
    const transcriptParam = searchParams.get('transcript')
    const taskIdParam = searchParams.get('taskId')
    
    if (transcriptParam) {
      setFormData(prev => ({
        ...prev,
        transcript: decodeURIComponent(transcriptParam)
      }))
      // 如果有transcript，直接跳转到步骤2
      setCurrentStep(2)
      toast.success("转录内容已加载，可以开始AI分析")
    }
    
    // 如果有taskId，获取转录任务信息（包括scheduleId）
    if (taskIdParam) {
      setCurrentTaskId(taskIdParam)
      
      // 获取转录任务信息，包括关联的scheduleId
      fetch(`/api/tasks/transcription/${taskIdParam}`)
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data) {
            // 如果转录任务有关联的scheduleId，自动设置
            if (result.data.scheduleId) {
              setFormData(prev => ({
                ...prev,
                scheduleId: result.data.scheduleId
              }))
            }
          }
        })
        .catch(error => {
          console.error('获取转录任务信息失败:', error)
        })
    }
  }, [searchParams])

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/schedules")
      const data = await response.json()
      setSchedules(data)
    } catch (error) {
      console.error("Failed to fetch schedules:", error)
    }
  }

  const validateAndSetFile = (file: File) => {
    // 验证文件类型
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 
      'audio/m4a', 'audio/mp4', 'audio/x-m4a',
      'audio/ogg', 'audio/webm'
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error("不支持的文件类型，请上传 MP3、WAV、M4A、OGG 或 WebM 格式的音频文件")
      return false
    }

    // 验证文件大小（通义千问ASR限制：10MB）
    const maxSize = 10 * 1024 * 1024 // 10MB（通义千问ASR要求）
    
    if (file.size > maxSize) {
      toast.error(`文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB。通义千问ASR要求文件不超过10MB，且时长不超过3分钟。请使用FFmpeg压缩或裁剪。`)
      return false
    }
    

    // 清理之前的文件URL
    if (audioFile) {
      URL.revokeObjectURL(audioUrl)
    }

    setAudioFile(file)
    const url = URL.createObjectURL(file)
    setAudioUrl(url)
    toast.success(`录音文件上传成功: ${file.name}`)
    return true
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    
    const files = event.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      validateAndSetFile(file)
    }
  }

  const handleRemoveFile = () => {
    if (audioFile) {
      URL.revokeObjectURL(audioUrl)
      setAudioFile(null)
      setAudioUrl("")
      setFormData(prev => ({ ...prev, transcript: "" }))
      toast.success("文件已移除")
    }
  }

  // 组件卸载时清理文件URL
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const handleTranscribe = async () => {
    if (!audioFile) {
      toast.error("请先上传录音文件")
      return
    }

    setIsUploading(true)
    
    try {
      // 创建FormData来上传文件
      const uploadFormData = new FormData()
      uploadFormData.append('audio', audioFile)
      // 如果有scheduleId，也传递过去（用于关联）
      if (formData.scheduleId) {
        uploadFormData.append('scheduleId', formData.scheduleId)
      }
      
      // 调用异步任务API
      const response = await fetch('/api/ai', {
        method: 'POST',
        body: uploadFormData,
        // 不设置Content-Type，让浏览器自动设置multipart/form-data边界
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.taskId) {
          // 任务已创建
          setCurrentTaskId(result.taskId)
          toast.success(`任务已提交，预计需要 ${result.estimatedDuration} 分钟。完成后会收到通知提醒。`, {
            duration: 3000
          })
          
          // 用户现在可以离开页面，任务会在后台处理
          setIsUploading(false)
          
          // 延迟跳转，让用户看到提示信息
          setTimeout(() => {
            router.push('/interviews')
          }, 1500)
        } else {
          throw new Error(result.message || "创建任务失败")
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        
        // 检查是否是credits相关错误
        if (response.status === 402 || errorData.error === 'Credits不足') {
          let errorMessage = errorData.message || "Credits不足"
          
          // 如果有credits信息，显示更详细的错误
          if (errorData.creditsInfo) {
            const info = errorData.creditsInfo
            errorMessage = `${errorMessage}\n\n当前状态：\n- Credits余额: ${info.creditsBalance || 0}\n- 今日已用: ${info.dailyUsed || 0}/${info.dailyUsed + info.dailyRemaining || 200}\n- 本月已用: ${info.monthlyUsed || 0}/${info.monthlyUsed + info.monthlyRemaining || 2000}`
          }
          
          throw new Error(errorMessage)
        }
        
        throw new Error(errorData.message || errorData.error || "转文字服务暂时不可用")
      }
    } catch (error) {
      console.error("Transcribe error:", error)
      
      // 根据错误类型提供更具体的错误信息
      let errorMessage = "转文字失败，请重试"
      if (error instanceof Error) {
        if (error.message.includes("File too large")) {
          errorMessage = "文件过大，请上传小于 100MB 的音频文件"
        } else if (error.message.includes("Unsupported file type")) {
          errorMessage = "不支持的文件类型，请上传支持的音频格式"
        } else if (error.message.includes("Network")) {
          errorMessage = "网络错误，请检查网络连接后重试"
        } else if (error.message.includes("Credits不足") || error.message.includes("credits")) {
          // Credits错误，显示详细错误信息（包含状态信息）
          errorMessage = error.message
        } else if (error.message.includes("扣除credits失败")) {
          errorMessage = "系统错误：扣除credits失败，请刷新页面重试。如果问题持续，请联系管理员。"
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
      setIsUploading(false)
    }
  }

  // 任务完成回调，自动填充转录结果（目前未使用）
  const _handleTaskComplete = useCallback((transcript: string) => {
    setFormData(prev => {
      // 如果已经有内容，不覆盖（避免重复填充）
      if (prev.transcript && prev.transcript.trim()) {
        return prev
      }
      return { ...prev, transcript }
    })
    toast.success("语音转文字完成！")
    // 可以选择自动进入下一步
    if (currentStep === 1) {
      setCurrentStep(2)
    }
  }, [currentStep])


  const handleAnalyze = async () => {
    if (!formData.transcript) {
      toast.error("请先进行语音转文字")
      return
    }

    setIsAnalyzing(true)
    
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "analyze",
          data: { transcript: formData.transcript }
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setAnalysis(result.data)
        
        // 将AI分析的问题添加到questions数组
        const analyzedQuestions: Question[] = (result.data.questionAnalysis || []).map((q: any, index: number) => ({
          id: `ai-${index}-${Math.random().toString(36).substr(2, 9)}`,
          questionText: q.question,
          userAnswer: q.answer,
          aiEvaluation: typeof q.evaluation === 'string' ? q.evaluation : JSON.stringify(q.evaluation),
          recommendedAnswer: typeof q.recommendedAnswer === 'string' ? q.recommendedAnswer : JSON.stringify(q.recommendedAnswer),
          questionType: q.questionType || "technical",
          difficulty: q.difficulty || "medium",
          priority: q.priority || "medium"
        }))
        
        setQuestions(analyzedQuestions)
        // 格式化AI分析结果为可读文本
        const formatAnalysis = (data: any) => {
          let analysis = ""
          
          // 处理优势
          if (data.strengths && data.strengths.length > 0) {
            analysis += "**优势分析：**\n"
            const strengthsText = data.strengths.map((strength: any) => {
              if (typeof strength === 'string') {
                return strength
              } else if (strength && typeof strength === 'object') {
                return strength.description || strength
              }
              return strength
            }).join(' ')
            analysis += strengthsText + "\n\n"
          }
          
          // 处理不足
          if (data.weaknesses && data.weaknesses.length > 0) {
            analysis += "**不足之处：**\n"
            const weaknessesText = data.weaknesses.map((weakness: any) => {
              if (typeof weakness === 'string') {
                return weakness
              } else if (weakness && typeof weakness === 'object') {
                return weakness.description || weakness
              }
              return weakness
            }).join(' ')
            analysis += weaknessesText + "\n\n"
          }
          
          // 处理建议
          if (data.suggestions && data.suggestions.length > 0) {
            analysis += "**改进建议：**\n"
            const suggestionsText = data.suggestions.map((suggestion: any) => {
              if (typeof suggestion === 'string') {
                return suggestion
              } else if (suggestion && typeof suggestion === 'object') {
                return suggestion.suggestion || suggestion
              }
              return suggestion
            }).join(' ')
            analysis += suggestionsText + "\n\n"
          }
          
          // 处理综合反馈
          if (data.comprehensiveFeedback) {
            const feedback = data.comprehensiveFeedback
            if (feedback.technicalAssessment) {
              analysis += `**技术能力评估：**\n${feedback.technicalAssessment}\n\n`
            }
            if (feedback.communicationSkills) {
              analysis += `**表达沟通能力：**\n${feedback.communicationSkills}\n\n`
            }
            if (feedback.learningPotential) {
              analysis += `**学习潜力：**\n${feedback.learningPotential}\n\n`
            }
            if (feedback.experienceEvaluation) {
              analysis += `**项目经验：**\n${feedback.experienceEvaluation}\n\n`
            }
            if (feedback.overallImpression) {
              analysis += `**整体印象：**\n${feedback.overallImpression}\n\n`
            }
            if (feedback.keyHighlights) {
              analysis += `**关键亮点：**\n${feedback.keyHighlights}\n\n`
            }
            if (feedback.mainConcerns) {
              analysis += `**主要关注点：**\n${feedback.mainConcerns}\n\n`
            }
            if (feedback.recommendation) {
              analysis += `**总体建议：**\n${feedback.recommendation}\n\n`
            }
          }
          
          return analysis.trim()
        }

        setFormData(prev => ({
          ...prev,
          aiAnalysis: formatAnalysis(result.data)
        }))
        
        toast.success("AI分析完成")
      } else {
        toast.error("分析失败，请重试")
      }
    } catch (error) {
      console.error("Analyze error:", error)
      toast.error("分析失败，请重试")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast.error("请先登录")
      return
    }

    if (!formData.transcript && questions.length === 0) {
      toast.error("请至少填写面试内容或添加面试题目")
      return
    }

    setIsLoading(true)

    try {
      // 处理 scheduleId：空字符串、null 或 "skip" 时不传递或传 null
      const requestBody = {
        ...formData,
        scheduleId: (formData.scheduleId && formData.scheduleId !== "" && formData.scheduleId !== "skip") 
          ? formData.scheduleId 
          : null,
        taskId: currentTaskId || null,  // 传递转录任务ID，用于匹配已有记录
        questions: questions.map(q => ({
          questionText: q.questionText,
          userAnswer: q.userAnswer,
          aiEvaluation: q.aiEvaluation,
          recommendedAnswer: q.recommendedAnswer,
          questionType: q.questionType,
          difficulty: q.difficulty,
          priority: q.priority
        }))
      }

      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const result = await response.json()
        const recordId = result.data?.id
        const isUpdated = result.updated === true  // 是否是更新操作
        
        // 埋点：记录面试创建成功
        trackFeatureUse('interview_create', {
          recordId,
          hasScheduleId: !!formData.scheduleId,
          hasTranscript: !!formData.transcript,
          questionsCount: questions.length,
          isUpdate: isUpdated,
        })
        
        // 如果是从转录任务创建的，标记任务为已读
        if (currentTaskId) {
          try {
            await fetch('/api/notifications', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ taskId: currentTaskId })
            })
          } catch (error) {
            console.error('标记通知已读失败:', error)
          }
        }
        
        toast.success(isUpdated ? "面试复盘记录已更新！" : "面试复盘记录创建成功！")
        // 跳转到详情页
        if (recordId) {
          router.push(`/interviews/${recordId}`)
        } else {
          router.push("/interviews")
        }
      } else {
        toast.error("创建失败，请重试")
      }
    } catch (error) {
      console.error("Create interview record error:", error)
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
    
    // 如果选择了面试安排，关闭快速创建
    if (field === "scheduleId" && value && value !== "skip") {
      setShowQuickCreate(false)
    }
  }

  const handleQuickCreateChange = (field: string, value: string | number) => {
    setQuickCreateData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleQuickCreateSchedule = async () => {
    if (!quickCreateData.company || !quickCreateData.position || !quickCreateData.interviewDate) {
      toast.error("请填写必填字段")
      return
    }

    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quickCreateData),
      })

      if (response.ok) {
        const newSchedule = await response.json()
        setSchedules(prev => [...prev, newSchedule])
        setFormData(prev => ({ ...prev, scheduleId: newSchedule.id }))
        setShowQuickCreate(false)
        setQuickCreateData({
          company: "",
          position: "",
          department: "",
          interviewDate: "",
          round: 1
        })
        toast.success("面试安排创建成功！")
      } else {
        toast.error("创建失败，请重试")
      }
    } catch (error) {
      console.error("Create schedule error:", error)
      toast.error("创建失败，请重试")
    }
  }

  const handleClearSchedule = () => {
    setFormData(prev => ({ ...prev, scheduleId: "" }))
  }

  const handleToggleQuickCreate = () => {
    if (!showQuickCreate) {
      // 如果开启快速创建，清空已选择的面试安排
      setFormData(prev => ({ ...prev, scheduleId: "" }))
    }
    setShowQuickCreate(!showQuickCreate)
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `manual-${Math.random().toString(36).substr(2, 9)}`,
      questionText: "",
      userAnswer: "",
      aiEvaluation: "",
      questionType: "algorithm"
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const updateQuestion = (id: string, field: string, value: string | number) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ))
  }

  const selectedSchedule = formData.scheduleId && formData.scheduleId !== "skip" 
    ? schedules.find(s => s.id === formData.scheduleId) 
    : null

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
          <p className="text-gray-600 mb-6">登录后即可创建面试复盘</p>
          <Button asChild>
            <Link href="/auth/signin">立即登录</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">新建面试复盘</h1>
          <p className="text-gray-600 mt-1">上传面试录音，AI自动分析并生成复盘记录</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="w-full">
        <div className="flex items-center justify-center gap-3 md:gap-4 text-sm">
          <div className={`flex items-center gap-2 ${currentStep === 1 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${currentStep === 1 ? 'bg-blue-600' : 'bg-gray-300'}`}>1</div>
            <span>上传与关联</span>
          </div>
          <div className="h-px w-12 md:w-24 bg-gray-200" />
          <div className={`flex items-center gap-2 ${currentStep === 2 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${currentStep === 2 ? 'bg-blue-600' : 'bg-gray-300'}`}>2</div>
            <span>记录与分析</span>
          </div>
        </div>
      </div>

      {/* Step 1: 上传与关联 */}
      {currentStep === 1 && (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Schedule Selection */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                关联面试安排（可选）
              </CardTitle>
              <CardDescription>
                可以选择关联已有面试安排，或直接创建复盘记录
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="scheduleId">面试安排</Label>
                  {formData.scheduleId && formData.scheduleId !== "skip" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSchedule}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Select value={formData.scheduleId} onValueChange={(value) => handleInputChange("scheduleId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择面试安排（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>跳过关联，直接创建复盘</span>
                      </div>
                    </SelectItem>
                    {schedules.map(schedule => (
                      <SelectItem key={schedule.id} value={schedule.id}>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{schedule.company}</div>
                            <div className="text-xs text-gray-500">
                              {schedule.position} · 第{schedule.round}轮
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedSchedule && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900">{selectedSchedule.company}</h4>
                  <p className="text-sm text-blue-700">
                    {selectedSchedule.position} · 第{selectedSchedule.round}轮面试
                  </p>
                </div>
              )}
              
              {(!formData.scheduleId || formData.scheduleId === "skip") && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-700">直接创建复盘记录</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    无需关联面试安排，可以直接上传录音或手动记录进行复盘
                  </p>
                </div>
              )}

              <div className="pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleToggleQuickCreate}
                  disabled={!!(formData.scheduleId && formData.scheduleId !== "skip")}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {showQuickCreate ? "取消创建" : "快速创建面试安排"}
                </Button>
                {formData.scheduleId && formData.scheduleId !== "skip" && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    已选择面试安排，无法快速创建
                  </p>
                )}
                
                {showQuickCreate && (
                  <div className="mt-4 p-6 border rounded-lg bg-gray-50 space-y-4">
                    <h4 className="font-medium text-gray-900">快速创建面试安排</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">公司名称 *</Label>
                        <Input
                          id="company"
                          placeholder="如：腾讯"
                          value={quickCreateData.company}
                          onChange={(e) => handleQuickCreateChange("company", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">职位 *</Label>
                        <Input
                          id="position"
                          placeholder="如：前端开发工程师"
                          value={quickCreateData.position}
                          onChange={(e) => handleQuickCreateChange("position", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">部门</Label>
                        <Input
                          id="department"
                          placeholder="如：技术部"
                          value={quickCreateData.department}
                          onChange={(e) => handleQuickCreateChange("department", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="interviewDate">面试日期 *</Label>
                        <Input
                          id="interviewDate"
                          type="datetime-local"
                          value={quickCreateData.interviewDate}
                          onChange={(e) => handleQuickCreateChange("interviewDate", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="round">面试轮次</Label>
                        <Input
                          id="round"
                          type="number"
                          min="1"
                          value={quickCreateData.round}
                          onChange={(e) => handleQuickCreateChange("round", parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      onClick={handleQuickCreateSchedule}
                      className="w-full"
                    >
                      创建面试安排
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            </Card>

            {/* Audio Upload */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                录音上传 (推荐)
              </CardTitle>
              <CardDescription>
                上传面试录音，AI自动转文字并分析
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-4">
                  点击上传或拖拽录音文件到此处
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  支持 MP3、WAV、M4A、OGG、WebM 格式，最大 10MB，时长≤3分钟
                </p>
                <p className="text-xs text-amber-600 mb-2">
                  ⚠️ 推荐使用 MP3 或 WAV 格式（最兼容）。M4A 可能需要特定参数（16kHz，单声道），如失败请使用 FFmpeg 转换。
                </p>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  variant="outline"
                >
                  选择文件
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/mp4,audio/x-m4a,audio/ogg,audio/webm"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {audioFile && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">文件已上传</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-green-700">{audioFile.name}</p>
                  <p className="text-xs text-green-600">
                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB · {audioFile.type}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Button 
                  onClick={handleTranscribe} 
                  disabled={isUploading || !audioFile}
                  className="w-full"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isUploading ? "转文字中..." : "语音转文字"}
                </Button>
                {!audioFile && (
                  <p className="text-xs text-gray-500 text-center">请先选择并上传录音文件</p>
                )}
              </div>
            </CardContent>
            </Card>
        </div>
      )}

      {/* Step 2: 记录与分析 */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Main Form */}
          <div className="xl:col-span-3 space-y-6">
            {/* Interview Transcript */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                面试内容记录
              </CardTitle>
              <CardDescription>
                {formData.transcript ? "AI已自动生成内容，您可手动调整" : "手动记录面试内容或使用AI自动生成（录音转文字）"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="transcript">面试内容</Label>
                <Textarea
                  id="transcript"
                  placeholder="记录面试过程中的主要内容和对话..."
                  value={formData.transcript}
                  onChange={(e) => handleInputChange("transcript", e.target.value)}
                  rows={8}
                  className={formData.transcript ? "bg-green-50" : ""}
                />
                {formData.transcript && (
                  <p className="text-xs text-green-600">✓ AI已自动生成内容</p>
                )}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing || !formData.transcript}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isAnalyzing ? "AI分析中..." : "AI智能分析"}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                    >返回上一步</Button>
                  </div>
              </div>
            </CardContent>
            </Card>

          {/* AI Analysis - 在窄屏幕上显示 */}
          <div className="xl:hidden space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle>AI分析</CardTitle>
                    {formData.aiAnalysis && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        已生成
                      </span>
                    )}
                  </div>
                  {formData.aiAnalysis && !isEditingAiAnalysis && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingAiAnalysis(true)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      编辑
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {formData.aiAnalysis ? "AI已自动分析，您可手动调整" : "AI对整体面试表现的分析"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!formData.aiAnalysis ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm">AI分析结果将在这里显示</p>
                    <p className="text-xs text-gray-400 mt-1">完成语音转文字后点击&ldquo;AI智能分析&rdquo;</p>
                  </div>
                ) : isEditingAiAnalysis ? (
                  <div className="space-y-2">
                    <Label htmlFor="aiAnalysis">AI分析结果</Label>
                    <Textarea
                      id="aiAnalysis"
                      placeholder="AI分析结果和建议..."
                      value={formData.aiAnalysis}
                      onChange={(e) => handleInputChange("aiAnalysis", e.target.value)}
                      rows={6}
                      className="bg-blue-50"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setIsEditingAiAnalysis(false)}
                      >
                        保存
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingAiAnalysis(false)}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="prose prose-sm max-w-none">
                        {formData.aiAnalysis.split('\n').map((line, index) => {
                          if (line.startsWith('## ')) {
                            return (
                              <h2 key={index} className="text-lg font-semibold text-gray-900 mt-4 mb-2 first:mt-0">
                                {line.replace('## ', '')}
                              </h2>
                            )
                          } else if (line.startsWith('### ')) {
                            return (
                              <h3 key={index} className="text-base font-medium text-gray-800 mt-3 mb-1">
                                {line.replace('### ', '')}
                              </h3>
                            )
                          } else if (line.startsWith('**') && line.endsWith('**')) {
                            return (
                              <p key={index} className="font-medium text-gray-800 mb-1">
                                {line.replace(/\*\*/g, '')}
                              </p>
                            )
                          } else if (line.match(/^\d+\./)) {
                            return (
                              <p key={index} className="text-gray-700 mb-1 ml-4">
                                {line}
                              </p>
                            )
                          } else if (line.trim() === '') {
                            return <br key={index} />
                          } else {
                            return (
                              <p key={index} className="text-gray-700 mb-1">
                                {line}
                              </p>
                            )
                          }
                        })}
                      </div>
                    </div>
                    <p className="text-xs text-blue-600">✓ AI已自动分析</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button - 在窄屏幕上显示 */}
            <div className="flex gap-4">
              <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
                {isLoading ? "保存中..." : "创建复盘记录"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/interviews">取消</Link>
              </Button>
            </div>
          </div>

          {/* Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  面试题目
                  {questions.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      AI已生成 {questions.length} 题
                    </span>
                  )}
                </div>
                <Button type="button" onClick={addQuestion} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  添加题目
                </Button>
              </CardTitle>
              <CardDescription>
                {questions.length > 0 ? "AI自动提取的面试题目，您可手动调整" : "记录面试中遇到的问题和您的回答（AI分析后会自动生成）"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((question, index) => (
                <QuestionDisplay
                  key={question.id}
                  question={question}
                  index={index}
                  onUpdate={updateQuestion}
                  onRemove={removeQuestion}
                />
              ))}
              
              {questions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无面试题目</p>
                  <p className="text-sm">点击&ldquo;添加题目&rdquo;开始记录</p>
                </div>
              )}
            </CardContent>
          </Card>
          </div>

          {/* Sidebar - 在大屏幕上显示 */}
          <div className="hidden xl:block xl:col-span-2 space-y-6">
          {/* AI Analysis */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>AI分析</CardTitle>
                  {formData.aiAnalysis && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      已生成
                    </span>
                  )}
                </div>
                {formData.aiAnalysis && !isEditingAiAnalysis && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingAiAnalysis(true)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    编辑
                  </Button>
                )}
              </div>
              <CardDescription>
                {formData.aiAnalysis ? "AI已自动分析，您可手动调整" : "AI对整体面试表现的分析"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!formData.aiAnalysis ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm">AI分析结果将在这里显示</p>
                  <p className="text-xs text-gray-400 mt-1">完成语音转文字后点击&ldquo;AI智能分析&rdquo;</p>
                </div>
              ) : isEditingAiAnalysis ? (
                <div className="space-y-2">
                  <Label htmlFor="aiAnalysis">AI分析结果</Label>
                  <Textarea
                    id="aiAnalysis"
                    placeholder="AI分析结果和建议..."
                    value={formData.aiAnalysis}
                    onChange={(e) => handleInputChange("aiAnalysis", e.target.value)}
                    rows={6}
                    className="bg-blue-50"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIsEditingAiAnalysis(false)}
                    >
                      保存
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingAiAnalysis(false)}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="prose prose-sm max-w-none">
                      {formData.aiAnalysis.split('\n').map((line, index) => {
                        if (line.startsWith('## ')) {
                          return (
                            <h2 key={index} className="text-lg font-semibold text-gray-900 mt-4 mb-2 first:mt-0">
                              {line.replace('## ', '')}
                            </h2>
                          )
                        } else if (line.startsWith('### ')) {
                          return (
                            <h3 key={index} className="text-base font-medium text-gray-800 mt-3 mb-1">
                              {line.replace('### ', '')}
                            </h3>
                          )
                        } else if (line.startsWith('**') && line.endsWith('**')) {
                          return (
                            <p key={index} className="font-medium text-gray-800 mb-1">
                              {line.replace(/\*\*/g, '')}
                            </p>
                          )
                        } else if (line.match(/^\d+\./)) {
                          return (
                            <p key={index} className="text-gray-700 mb-1 ml-4">
                              {line}
                            </p>
                          )
                        } else if (line.trim() === '') {
                          return <br key={index} />
                        } else {
                          return (
                            <p key={index} className="text-gray-700 mb-1">
                              {line}
                            </p>
                          )
                        }
                      })}
                    </div>
                  </div>
                  <p className="text-xs text-blue-600">✓ AI已自动分析</p>
                </div>
              )}
            </CardContent>
            </Card>


            {/* Submit Button */}
            <div className="flex gap-4">
              <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
                {isLoading ? "保存中..." : "创建复盘记录"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/interviews">取消</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 下一步提示弹窗 */}
      <Dialog open={showNextStepDialog} onOpenChange={setShowNextStepDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>语音转文字进行中</DialogTitle>
            <DialogDescription>
              您的录音正在后台处理中，完成后会收到通知提醒
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium">预计处理时间：5-15分钟</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium">接下来的步骤：</span>
              </div>
            </div>
            <div className="pl-4 space-y-2 text-sm text-gray-600">
              <p>1. 在面试复盘页面查看转录进度</p>
              <p>2. 转录完成后，点击&ldquo;去做AI分析&rdquo;按钮</p>
              <p>3. AI将自动分析您的面试表现并生成反馈</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">💡 提示</p>
              <p>您可以随时在面试复盘页面查看任务状态和完成后续操作</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNextStepDialog(false)}>
              继续编辑
            </Button>
            <Button onClick={() => {
              setShowNextStepDialog(false)
              router.push("/interviews")
            }}>
              前往面试复盘页面
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
