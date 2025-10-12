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
import { ArrowLeft, Calendar, Building, FileText, Plus, Trash2, Mic, Upload, Sparkles } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

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
  const [_audioUrl, setAudioUrl] = useState<string>("")
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAudioFile(file)
      const url = URL.createObjectURL(file)
      setAudioUrl(url)
      toast.success("录音文件上传成功")
    }
  }

  const handleTranscribe = async () => {
    if (!audioFile) {
      toast.error("请先上传录音文件")
      return
    }

    setIsUploading(true)
    
    try {
      // 模拟上传和转文字过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockTranscript = `
面试官：你好，请先自我介绍一下。
候选人：你好，我是张三，有3年前端开发经验，主要使用React和Vue框架开发过多个项目。
面试官：能说说你对React的理解吗？
候选人：React是一个用于构建用户界面的JavaScript库，它使用虚拟DOM来提高性能，支持组件化开发。
面试官：如何优化React应用性能？
候选人：可以使用React.memo、useMemo、useCallback等优化手段，还有代码分割、懒加载等技术。
面试官：能介绍一下你最近的项目吗？
候选人：最近做了一个电商平台的前端项目，使用了React + TypeScript + Ant Design，实现了用户管理、商品展示、购物车等功能。
      `

      setFormData(prev => ({ ...prev, transcript: mockTranscript.trim() }))
      toast.success("语音转文字完成")
    } catch (error) {
      console.error("Transcribe error:", error)
      toast.error("转文字失败，请重试")
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
        const analyzedQuestions: Question[] = result.data.questionAnalysis.map((q: {
          question: string
          answer: string
          evaluation: string
        }, index: number) => ({
          id: Date.now().toString() + index,
          questionText: q.question,
          userAnswer: q.answer,
          aiEvaluation: q.evaluation,
          questionType: "algorithm"
        }))
        
        setQuestions(analyzedQuestions)
        setFormData(prev => ({
          ...prev,
          feedback: result.data.suggestions.join('\n'),
          aiAnalysis: JSON.stringify(result.data)
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
        toast.success("面试记录创建成功！")
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

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
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

  const selectedSchedule = schedules.find(s => s.id === formData.scheduleId)

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可添加面试记录</p>
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/interviews">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">添加面试记录</h1>
          <p className="text-gray-600 mt-1">上传面试录音，AI自动分析并生成复盘记录</p>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                选择面试安排
              </CardTitle>
              <CardDescription>
                选择要记录的面试安排，如果没有可快速创建
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="scheduleId">面试安排 *</Label>
                <Select value={formData.scheduleId} onValueChange={(value) => handleInputChange("scheduleId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择面试安排" />
                  </SelectTrigger>
                  <SelectContent>
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
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900">{selectedSchedule.company}</h4>
                  <p className="text-sm text-blue-700">
                    {selectedSchedule.position} · 第{selectedSchedule.round}轮面试
                  </p>
                </div>
              )}

              {!formData.scheduleId && (
                <div className="mt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowQuickCreate(!showQuickCreate)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {showQuickCreate ? "取消创建" : "快速创建面试安排"}
                  </Button>
                  
                  {showQuickCreate && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50 space-y-3">
                      <h4 className="font-medium">快速创建面试安排</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="company">公司名称 *</Label>
                          <Input
                            id="company"
                            placeholder="如：腾讯"
                            value={quickCreateData.company}
                            onChange={(e) => handleQuickCreateChange("company", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="position">职位 *</Label>
                          <Input
                            id="position"
                            placeholder="如：前端开发工程师"
                            value={quickCreateData.position}
                            onChange={(e) => handleQuickCreateChange("position", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="department">部门</Label>
                          <Input
                            id="department"
                            placeholder="如：技术部"
                            value={quickCreateData.department}
                            onChange={(e) => handleQuickCreateChange("department", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="interviewDate">面试日期 *</Label>
                          <Input
                            id="interviewDate"
                            type="datetime-local"
                            value={quickCreateData.interviewDate}
                            onChange={(e) => handleQuickCreateChange("interviewDate", e.target.value)}
                          />
                        </div>
                        <div>
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
              )}
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-4">
                  点击上传或拖拽录音文件到此处
                </p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  选择文件
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {audioFile && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">文件已上传</span>
                  </div>
                  <p className="text-sm text-green-700">{audioFile.name}</p>
                  <p className="text-xs text-green-600">
                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB
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
                
                {formData.transcript && (
                  <Button 
                    onClick={handleAnalyze} 
                    disabled={isAnalyzing}
                    className="w-full"
                    variant="outline"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isAnalyzing ? "AI分析中..." : "AI智能分析"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Interview Transcript */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                面试内容记录
              </CardTitle>
              <CardDescription>
                {formData.transcript ? "AI已自动生成内容，您可手动调整" : "手动记录面试内容或使用AI自动生成"}
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
              </div>
            </CardContent>
          </Card>

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
                {questions.length > 0 ? "AI自动提取的面试题目，您可手动调整" : "记录面试中遇到的问题和您的回答"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">题目 {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>题目内容</Label>
                    <Textarea
                      placeholder="请输入面试题目..."
                      value={question.questionText}
                      onChange={(e) => updateQuestion(question.id, "questionText", e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>我的回答</Label>
                    <Textarea
                      placeholder="记录您的回答..."
                      value={question.userAnswer}
                      onChange={(e) => updateQuestion(question.id, "userAnswer", e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>题目类型</Label>
                      <Select
                        value={question.questionType}
                        onValueChange={(value) => updateQuestion(question.id, "questionType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="algorithm">算法题</SelectItem>
                          <SelectItem value="system_design">系统设计</SelectItem>
                          <SelectItem value="behavioral">行为面试</SelectItem>
                          <SelectItem value="technical">技术问题</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                  </div>
                  
                  <div className="space-y-2">
                    <Label>AI评价</Label>
                    <Textarea
                      placeholder="AI对回答的评价和建议..."
                      value={question.aiEvaluation}
                      onChange={(e) => updateQuestion(question.id, "aiEvaluation", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
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

        {/* Sidebar */}
        <div className="space-y-6">

          {/* AI Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                AI分析
                {formData.aiAnalysis && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    已生成
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {formData.aiAnalysis ? "AI已自动分析，您可手动调整" : "AI对整体面试表现的分析"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="aiAnalysis">AI分析结果</Label>
                <Textarea
                  id="aiAnalysis"
                  placeholder="AI分析结果和建议..."
                  value={formData.aiAnalysis}
                  onChange={(e) => handleInputChange("aiAnalysis", e.target.value)}
                  rows={6}
                  className={formData.aiAnalysis ? "bg-blue-50" : ""}
                />
                {formData.aiAnalysis && (
                  <p className="text-xs text-blue-600">✓ AI已自动分析</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                反馈总结
                {formData.feedback && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    AI生成
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {formData.feedback ? "AI已自动生成反馈，您可手动调整" : "面试反馈和改进建议"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="feedback">反馈总结</Label>
                <Textarea
                  id="feedback"
                  placeholder="面试反馈和改进建议..."
                  value={formData.feedback}
                  onChange={(e) => handleInputChange("feedback", e.target.value)}
                  rows={6}
                  className={formData.feedback ? "bg-green-50" : ""}
                />
                {formData.feedback && (
                  <p className="text-xs text-green-600">✓ AI已自动生成</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
              {isLoading ? "保存中..." : "保存记录"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/interviews">取消</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
