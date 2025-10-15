"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, Building, FileText, Plus, Trash2, Mic, Upload, Sparkles, Edit, TrendingUp, X } from "lucide-react"
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
}

export default function NewInterviewPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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
  const [isEditingFeedback, setIsEditingFeedback] = useState(false)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)

  useEffect(() => {
    if (session) {
      fetchSchedules()
    }
  }, [session])

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

    // 验证文件大小（100MB限制，超过25MB会提示分段处理）
    const maxSize = 100 * 1024 * 1024 // 100MB
    const whisperLimit = 25 * 1024 * 1024 // 25MB (Whisper API限制)
    
    if (file.size > maxSize) {
      toast.error("文件过大，请上传小于 100MB 的音频文件")
      return false
    }
    
    if (file.size > whisperLimit) {
      toast.warning(`文件较大（${(file.size / 1024 / 1024).toFixed(1)}MB），建议压缩到25MB以下以获得最佳效果`)
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
      const formData = new FormData()
      formData.append('audio', audioFile)
      
      // 调用真实的语音转文字API
      const response = await fetch('/api/ai', {
        method: 'POST',
        body: formData,
        // 不设置Content-Type，让浏览器自动设置multipart/form-data边界
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // 处理包含说话人信息的转录结果
          const transcriptData = result.data
          setFormData(prev => ({ ...prev, transcript: transcriptData.transcript }))
          
          // 显示说话人识别结果
          if (transcriptData.speakers && transcriptData.speakers.length > 0) {
            toast.success(`语音转文字完成！识别出 ${transcriptData.speakers.length} 个说话人：${transcriptData.speakers.join('、')}`)
          } else {
            toast.success("语音转文字完成")
          }
        } else {
          throw new Error(result.message || "转文字失败")
        }
      } else {
        throw new Error("转文字服务暂时不可用")
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
        }
      }
      
      toast.error(errorMessage)
      
      // 如果真实API失败，提供模拟数据作为fallback
      const mockTranscript = `
面试官：你好，请先自我介绍一下。

候选人：你好，我是张三，有3年前端开发经验，主要使用React和Vue框架开发过多个项目。我毕业于计算机科学专业，在校期间就接触了前端开发，毕业后一直专注于前端技术栈的学习和实践。

面试官：能说说你对React的理解吗？

候选人：React是一个用于构建用户界面的JavaScript库，它使用虚拟DOM来提高性能，支持组件化开发。React的核心概念包括组件、状态、属性、生命周期等。我在项目中主要使用函数式组件和Hooks，比如useState、useEffect、useContext等。React的虚拟DOM机制可以最小化DOM操作，提高渲染性能。

面试官：如何优化React应用性能？

候选人：React性能优化可以从多个方面入手。首先是组件层面，可以使用React.memo来避免不必要的重渲染，useMemo和useCallback来缓存计算结果和函数。其次是代码分割，使用React.lazy和Suspense实现按需加载。还有列表渲染优化，使用key属性，避免在render中创建新对象。另外还有状态管理优化，合理使用useState和useReducer，避免状态过于复杂。

面试官：能介绍一下你最近的项目吗？

候选人：最近做了一个电商平台的前端项目，使用了React + TypeScript + Ant Design，实现了用户管理、商品展示、购物车等功能。项目采用微前端架构，主应用使用single-spa，子应用独立开发和部署。我负责商品模块的开发，包括商品列表、详情页、搜索筛选等功能。在性能优化方面，我使用了虚拟滚动来处理大量商品数据，图片懒加载减少首屏加载时间。

面试官：在项目中遇到过哪些技术难点，是如何解决的？

候选人：最大的难点是商品搜索的性能问题。当用户输入搜索关键词时，需要实时搜索并展示结果，但商品数据量很大，直接遍历会很慢。我采用了防抖技术，延迟300ms执行搜索，避免频繁请求。同时使用Web Worker在后台进行搜索计算，不阻塞主线程。还实现了搜索结果的缓存机制，相同关键词直接返回缓存结果。

面试官：你了解哪些前端工程化工具？

候选人：我熟悉Webpack、Vite等打包工具，了解它们的配置和优化。使用过ESLint、Prettier进行代码规范，Husky做Git钩子，Jest做单元测试。在CI/CD方面，使用过GitHub Actions和Jenkins。还了解过微前端方案，比如qiankun、single-spa等。

面试官：对TypeScript有什么理解？

候选人：TypeScript是JavaScript的超集，提供了静态类型检查。我在项目中大量使用TypeScript，可以提前发现类型错误，提高代码质量。我熟悉接口定义、泛型、联合类型、交叉类型等概念。TypeScript的智能提示和重构功能也大大提高了开发效率。

面试官：你如何保证代码质量？

候选人：首先建立代码规范，使用ESLint和Prettier统一代码风格。其次编写单元测试，使用Jest和React Testing Library测试组件功能。还有代码审查，通过Pull Request进行同行评审。最后是持续集成，每次提交都自动运行测试和构建，确保代码质量。

面试官：你平时如何学习新技术？

候选人：我主要通过官方文档、技术博客、开源项目来学习新技术。会关注一些技术社区，比如掘金、思否等。也会通过实际项目来实践新技术，遇到问题会查阅资料或向同事请教。还会参加一些技术会议和线上分享，了解行业动态。

面试官：你对前端发展趋势有什么看法？

候选人：我认为前端正在向全栈方向发展，Node.js让前端可以处理服务端逻辑。微前端架构也越来越成熟，可以更好地支持大型应用。还有WebAssembly、PWA等新技术，让前端应用更接近原生体验。另外，低代码平台和无代码工具也在兴起，可能会改变前端开发的模式。

面试官：你有什么问题要问我们吗？

候选人：我想了解一下公司的技术栈和团队规模，以及这个岗位的具体职责。还有公司对新技术的接受程度，是否有技术分享和学习的氛围。

面试官：我们主要使用React + Node.js的技术栈，团队有20人左右，这个岗位主要负责前端开发。我们鼓励技术创新，每周都有技术分享会。

候选人：听起来很不错，我很期待能加入这样的团队。

面试官：好的，今天的面试就到这里，我们会在一周内给你回复。

候选人：谢谢，期待您的回复。
      `
      
      setFormData(prev => ({ ...prev, transcript: mockTranscript.trim() }))
      toast.info("使用模拟数据，请手动调整内容")
    } finally {
      setIsUploading(false)
    }
  }

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
          questionType: q.questionType || "technical"
        }))
        
        setQuestions(analyzedQuestions)
        // 格式化AI分析结果为可读文本
        const formatAnalysis = (data: any) => {
          let analysis = ""
          
          // 处理优势
          if (data.strengths && data.strengths.length > 0) {
            analysis += "## 优势\n"
            data.strengths.forEach((strength: any, index: number) => {
              if (typeof strength === 'string') {
                analysis += `${index + 1}. ${strength}\n`
              } else if (strength && typeof strength === 'object') {
                analysis += `${index + 1}. ${strength.description || strength}\n`
              }
            })
            analysis += "\n"
          }
          
          // 处理不足
          if (data.weaknesses && data.weaknesses.length > 0) {
            analysis += "## 不足\n"
            data.weaknesses.forEach((weakness: any, index: number) => {
              if (typeof weakness === 'string') {
                analysis += `${index + 1}. ${weakness}\n`
              } else if (weakness && typeof weakness === 'object') {
                analysis += `${index + 1}. ${weakness.description || weakness}\n`
              }
            })
            analysis += "\n"
          }
          
          // 处理建议
          if (data.suggestions && data.suggestions.length > 0) {
            analysis += "## 改进建议\n"
            data.suggestions.forEach((suggestion: any, index: number) => {
              if (typeof suggestion === 'string') {
                analysis += `${index + 1}. ${suggestion}\n`
              } else if (suggestion && typeof suggestion === 'object') {
                analysis += `${index + 1}. ${suggestion.suggestion || suggestion}\n`
              }
            })
            analysis += "\n"
          }
          
          // 处理题目分析
          if (data.questionAnalysis && data.questionAnalysis.length > 0) {
            analysis += "## 题目分析\n"
            data.questionAnalysis.forEach((q: any, index: number) => {
              analysis += `### 题目 ${index + 1}\n`
              analysis += `**问题：** ${q.question}\n`
              analysis += `**回答：** ${q.answer}\n`
              
              // 处理评价
              if (q.evaluation) {
                if (typeof q.evaluation === 'string') {
                  analysis += `**评价：** ${q.evaluation}\n`
                } else if (typeof q.evaluation === 'object') {
                  analysis += `**评价：** ${q.evaluation.specificFeedback || JSON.stringify(q.evaluation)}\n`
                }
              }
              
              analysis += "\n"
            })
          } else {
            analysis += "## 题目分析\n"
            analysis += "本次录音内容较短，未提取到具体的面试题目和回答。建议上传更完整的面试录音以获得更详细的分析。\n\n"
          }
          
          return analysis.trim()
        }

        // 格式化反馈总结
        const formatFeedback = (data: any) => {
          if (data.suggestions && data.suggestions.length > 0) {
            return data.suggestions.map((suggestion: any) => {
              if (typeof suggestion === 'string') {
                return suggestion
              } else if (suggestion && typeof suggestion === 'object') {
                return suggestion.suggestion || suggestion.actionable || JSON.stringify(suggestion)
              }
              return suggestion
            }).join('\n')
          }
          return ""
        }

        setFormData(prev => ({
          ...prev,
          feedback: formatFeedback(result.data),
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
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          questions: questions.map(q => ({
            questionText: q.questionText,
            userAnswer: q.userAnswer,
            aiEvaluation: q.aiEvaluation,
            questionType: q.questionType
          }))
        }),
      })

      if (response.ok) {
        toast.success("面试复盘记录创建成功！")
        router.push("/interviews")
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
                  支持 MP3、WAV、M4A、OGG、WebM 格式，最大 100MB
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

            {/* Step navigation */}
            <div className="flex gap-4">
              <Button 
                className="flex-1" 
                onClick={() => setCurrentStep(2)}
                disabled={!formData.transcript}
              >
                下一步
              </Button>
              {!formData.transcript && (
                <div className="flex-1 text-xs text-gray-500 self-center">
                  完成“语音转文字”后方可进入下一步
                </div>
              )}
              <Button variant="outline" asChild>
                <Link href="/interviews">取消</Link>
              </Button>
            </div>
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
                    <p className="text-xs text-gray-400 mt-1">完成语音转文字后点击"AI智能分析"</p>
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

            {/* Feedback - 在窄屏幕上显示 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle>反馈总结</CardTitle>
                    {formData.feedback && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        AI生成
                      </span>
                    )}
                  </div>
                  {formData.feedback && !isEditingFeedback && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingFeedback(true)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      编辑
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {formData.feedback ? "AI已自动生成反馈，您可手动调整" : "面试反馈和改进建议"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!formData.feedback ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm">反馈总结将在这里显示</p>
                    <p className="text-xs text-gray-400 mt-1">完成AI分析后自动生成</p>
                  </div>
                ) : isEditingFeedback ? (
                  <div className="space-y-2">
                    <Label htmlFor="feedback">反馈总结</Label>
                    <Textarea
                      id="feedback"
                      placeholder="面试反馈和改进建议..."
                      value={formData.feedback}
                      onChange={(e) => handleInputChange("feedback", e.target.value)}
                      rows={6}
                      className="bg-green-50"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setIsEditingFeedback(false)}
                      >
                        保存
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingFeedback(false)}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-gray-900">
                        {formData.feedback}
                      </pre>
                    </div>
                    <p className="text-xs text-green-600">✓ AI已自动生成</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
                  <p className="text-xs text-gray-400 mt-1">完成语音转文字后点击"AI智能分析"</p>
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

          {/* Feedback */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>反馈总结</CardTitle>
                  {formData.feedback && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      AI生成
                    </span>
                  )}
                </div>
                {formData.feedback && !isEditingFeedback && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingFeedback(true)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    编辑
                  </Button>
                )}
              </div>
              <CardDescription>
                {formData.feedback ? "AI已自动生成反馈，您可手动调整" : "面试反馈和改进建议"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!formData.feedback ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm">反馈总结将在这里显示</p>
                  <p className="text-xs text-gray-400 mt-1">完成AI分析后自动生成</p>
                </div>
              ) : isEditingFeedback ? (
                <div className="space-y-2">
                  <Label htmlFor="feedback">反馈总结</Label>
                  <Textarea
                    id="feedback"
                    placeholder="面试反馈和改进建议..."
                    value={formData.feedback}
                    onChange={(e) => handleInputChange("feedback", e.target.value)}
                    rows={6}
                    className="bg-green-50"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIsEditingFeedback(false)}
                    >
                      保存
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingFeedback(false)}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-900">
                      {formData.feedback}
                    </pre>
                  </div>
                  <p className="text-xs text-green-600">✓ AI已自动生成</p>
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
    </div>
  )
}
