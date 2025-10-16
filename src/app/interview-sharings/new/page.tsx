"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Building2, User, Plus, X, ArrowLeft, Mic, Shield, Eye, EyeOff, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { maskSensitiveInfo, maskSensitiveInfoAsync, getSensitivityAdvice, batchProcessQuestionsWithAI } from "@/lib/privacy-utils"

interface InterviewRecord {
  id: string
  company: string
  position: string
  interviewDate: string
  round: number
  questions: any[]
  answers?: any[]
}

function NewInterviewSharingPageContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [interviewRecords, setInterviewRecords] = useState<InterviewRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<InterviewRecord | null>(null)
  const [preSelectedRecordId, setPreSelectedRecordId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    department: "",
    interviewDate: "",
    round: 1,
    difficulty: "",
    experience: "",
    questions: [] as any[],
    answers: [] as any[],
    tips: "",
    tags: "",
    isPublic: true,
    // 简化隐私设置 - 只分享问题，不分享回答
    selectedQuestions: [] as number[],
    // 隐私保护设置
    hideInterviewDate: true,
    hideInterviewRound: true
  })
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [newTag, setNewTag] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [sensitivityAdvice, setSensitivityAdvice] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // 获取URL参数中的面试记录ID
  useEffect(() => {
    const interviewRecordId = searchParams.get('interviewRecordId')
    if (interviewRecordId) {
      setPreSelectedRecordId(interviewRecordId)
    }
  }, [searchParams])

  const handleSelectRecord = useCallback(async (record: InterviewRecord) => {
    setSelectedRecord(record)
    setFormData(prev => ({
      ...prev,
      company: record.company,
      position: record.position,
      interviewDate: record.interviewDate,
      questions: record.questions || [],
      answers: record.answers || [],
      selectedQuestions: [] // 默认不选择任何问题，让用户主动选择
    }))
    
    // 检测敏感信息
    const allText = [
      record.company,
      record.position,
      ...(record.questions || []).map(q => typeof q === 'string' ? q : q.text || q.question || '')
    ].join(' ')
    
    const advice = getSensitivityAdvice(allText)
    setSensitivityAdvice(advice)
    
    // 自动对所有问题进行隐私处理
    if (record.questions && record.questions.length > 0) {
      await processQuestionsPrivacy(record.questions)
    }
  }, [])

  const fetchInterviewRecords = useCallback(async () => {
    try {
      const response = await fetch('/api/interviews')
      const data = await response.json()
      
      if (data.success) {
        setInterviewRecords(data.data)
        
        // 如果有预选的面试记录ID，自动选择该记录
        if (preSelectedRecordId) {
          const record = data.data.find((r: InterviewRecord) => r.id === preSelectedRecordId)
          if (record) {
            handleSelectRecord(record)
          }
        }
      }
    } catch (error) {
      console.error('获取面试记录失败:', error)
    }
  }, [preSelectedRecordId, handleSelectRecord])

  // 获取用户的面试记录
  useEffect(() => {
    if ((session?.user as any)?.id) {
      fetchInterviewRecords()
    }
  }, [session, preSelectedRecordId, fetchInterviewRecords])


  const _handleAddQuestion = () => {
    if (newQuestion.trim()) {
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, { text: newQuestion.trim(), type: 'custom' }]
      }))
      setNewQuestion("")
    }
  }

  const _handleRemoveQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
      answers: prev.answers.filter((_, i) => i !== index)
    }))
  }

  const _handleAddAnswer = (index: number) => {
    if (newAnswer.trim()) {
      const newAnswers = [...formData.answers]
      newAnswers[index] = { text: newAnswer.trim() }
      setFormData(prev => ({
        ...prev,
        answers: newAnswers
      }))
      setNewAnswer("")
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const newTags = [...tags, newTag.trim()]
      setTags(newTags)
      setFormData(prev => ({
        ...prev,
        tags: newTags.join(',')
      }))
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    setFormData(prev => ({
      ...prev,
      tags: newTags.join(',')
    }))
  }

  // 问题选择处理
  const handleQuestionToggle = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedQuestions: prev.selectedQuestions.includes(index)
        ? prev.selectedQuestions.filter(i => i !== index)
        : [...prev.selectedQuestions, index]
    }))
  }

  const handleSelectAllQuestions = () => {
    setFormData(prev => ({
      ...prev,
      selectedQuestions: Array.from({ length: prev.questions.length }, (_, i) => i)
    }))
  }

  const handleDeselectAllQuestions = () => {
    setFormData(prev => ({
      ...prev,
      selectedQuestions: []
    }))
  }

  // 获取脱敏后的内容预览 - 只分享问题，不分享回答
  // 存储已进行隐私处理的问题数据
  const [privacyProcessedQuestions, setPrivacyProcessedQuestions] = useState<any[]>([])
  const [maskedPreview, setMaskedPreview] = useState<{ questions: any[] }>({ questions: [] })

  // 在面试记录选择时自动进行隐私处理
  const processQuestionsPrivacy = async (questions: any[]) => {
    if (!questions || questions.length === 0) {
      setPrivacyProcessedQuestions([])
      return
    }
    
    console.log('开始对面试记录的所有问题进行隐私处理，问题数量:', questions.length)
    try {
      // 使用批量处理API对所有问题进行隐私处理
      const maskedQuestions = await batchProcessQuestionsWithAI(questions)
      console.log('隐私处理完成，处理后的问题:', maskedQuestions)
      setPrivacyProcessedQuestions(maskedQuestions)
    } catch (error) {
      console.error('批量脱敏处理失败:', error)
      // 回退到逐个处理
      try {
        const maskedQuestions = await Promise.all(
          questions.map(async q => {
            const text = typeof q === 'string' ? q : q.text || q.question || ''
            const maskedText = await maskSensitiveInfoAsync(text)
            return {
              ...q,
              text: maskedText
            }
          })
        )
        setPrivacyProcessedQuestions(maskedQuestions)
      } catch (fallbackError) {
        console.error('回退脱敏处理也失败:', fallbackError)
        // 最后回退到同步版本
        const fallbackQuestions = questions.map(q => ({
          ...q,
          text: maskSensitiveInfo(typeof q === 'string' ? q : q.text || q.question || '')
        }))
        setPrivacyProcessedQuestions(fallbackQuestions)
      }
    }
  }

  const updateMaskedPreview = useCallback(() => {
    if (!selectedRecord || privacyProcessedQuestions.length === 0) {
      setMaskedPreview({ questions: [] })
      return
    }
    
    // 从已处理的隐私数据中筛选出用户选择的问题
    const selectedQuestions = privacyProcessedQuestions.filter((_, index) => 
      formData.selectedQuestions.includes(index)
    )
    
    setMaskedPreview({ questions: selectedQuestions })
  }, [selectedRecord, privacyProcessedQuestions, formData.selectedQuestions])

  // 当选择的问题或隐私处理的数据变化时，更新脱敏预览
  useEffect(() => {
    updateMaskedPreview()
  }, [updateMaskedPreview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRecord) {
      alert('请先选择一个面试复盘记录')
      return
    }
    
    if (!formData.company || !formData.position || formData.questions.length === 0) {
      alert('面试记录信息不完整，无法发布面经')
      return
    }

    if (formData.selectedQuestions.length === 0) {
      alert('请至少选择一个问题进行分享')
      return
    }

    setLoading(true)
    try {
      // 使用已处理的隐私数据
      const selectedQuestions = privacyProcessedQuestions.filter((_, index) => 
        formData.selectedQuestions.includes(index)
      )
      
      // 确保有选择的问题
      if (selectedQuestions.length === 0) {
        alert('请至少选择一个问题进行分享')
        setLoading(false)
        return
      }
      
      // 使用已处理的隐私数据，无需重复处理
      const maskedPreview = { questions: selectedQuestions }
      
      const response = await fetch('/api/interview-sharings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          interviewRecordId: selectedRecord?.id,
          // 根据隐私设置决定是否发送日期和轮次信息
          interviewDate: formData.hideInterviewDate ? null : new Date(formData.interviewDate).toISOString(),
          round: formData.hideInterviewRound ? null : formData.round,
          // 只发送选中的问题，不发送回答
          questions: maskedPreview.questions,
          answers: [], // 不分享回答内容
          // 简化的隐私设置
          selectedQuestions: formData.selectedQuestions
        })
      })

      const data = await response.json()

      if (data.success) {
        router.push('/interview-sharings')
      } else {
        alert(data.error || '发布失败')
      }
    } catch (error) {
      console.error('发布失败:', error)
      alert('发布失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardContent className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">请先登录</h3>
            <p className="text-gray-500 mb-4">登录后才能发布面试记录分享</p>
            <Link href="/auth/signin">
              <Button>去登录</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <Link href="/interview-sharings" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回列表
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">发布面经</h1>
        <p className="text-gray-600 mt-2">从您的面试复盘记录中选择一个来发布面经，帮助其他求职者</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 显示当前选择的面试记录 */}
        {selectedRecord && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <Calendar className="w-5 h-5 mr-2" />
                已选择面试记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">{selectedRecord.company} - {selectedRecord.position}</h4>
                  <p className="text-sm text-blue-700">
                    {new Date(selectedRecord.interviewDate).toLocaleDateString()} · 第{selectedRecord.round}轮 · {selectedRecord.questions.length}个问题
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRecord(null)
                    setFormData({
                      company: "",
                      position: "",
                      department: "",
                      interviewDate: "",
                      round: 1,
                      difficulty: "",
                      experience: "",
                      questions: [],
                      answers: [],
                      tips: "",
                      tags: "",
                      isPublic: true,
                      selectedQuestions: [],
                      hideInterviewDate: true,
                      hideInterviewRound: true
                    })
                    setTags([])
                  }}
                  className="text-blue-600 border-blue-600 hover:bg-blue-100"
                >
                  重新选择
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 选择现有面试记录 */}
        {interviewRecords.length > 0 && !selectedRecord && !preSelectedRecordId && (
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                选择面试复盘记录
              </CardTitle>
              <CardDescription>
                请选择您要分享的面试复盘记录，只能从已有的面试复盘中选择
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {interviewRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSelectRecord(record)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{record.company} - {record.position}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(record.interviewDate).toLocaleDateString()} · 第{record.round}轮 · {record.questions.length}个问题
                        </p>
                      </div>
                      <Button type="button" size="sm">选择</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 没有面试记录时的提示 */}
        {interviewRecords.length === 0 && !preSelectedRecordId && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无面试复盘记录</h3>
              <p className="text-gray-500 mb-4">请先完成面试复盘，然后才能发布面经</p>
              <div className="flex gap-2 justify-center">
                <Link href="/interviews/new">
                  <Button>
                    <Mic className="w-4 h-4 mr-2" />
                    新建面试复盘
                  </Button>
                </Link>
                <Link href="/interviews">
                  <Button variant="outline">
                    查看面试复盘
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 基本信息 - 只读显示 */}
        {selectedRecord && (
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                面试信息
              </CardTitle>
              <CardDescription>
                以下信息来自您选择的面试复盘记录，不可修改
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>公司名称</Label>
                  <Input
                    value={formData.company}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>职位</Label>
                  <Input
                    value={formData.position}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hideInterviewDate"
                      checked={formData.hideInterviewDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hideInterviewDate: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="hideInterviewDate" className="text-sm text-gray-600">
                      隐藏面试日期（保护隐私）
                    </Label>
                  </div>
                  {!formData.hideInterviewDate && (
                    <Input
                      value={new Date(formData.interviewDate).toLocaleDateString()}
                      readOnly
                      className="bg-gray-50"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hideInterviewRound"
                      checked={formData.hideInterviewRound}
                      onChange={(e) => setFormData(prev => ({ ...prev, hideInterviewRound: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="hideInterviewRound" className="text-sm text-gray-600">
                      隐藏面试轮次（保护隐私）
                    </Label>
                  </div>
                  {!formData.hideInterviewRound && (
                    <Input
                      value={`第${formData.round}轮`}
                      readOnly
                      className="bg-gray-50"
                    />
                  )}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <Shield className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">隐私保护提示</p>
                    <p>系统将自动处理所有敏感信息（姓名、联系方式等），建议隐藏面试日期和轮次信息，避免被公司识别身份。</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 面经设置 */}
        <Card>
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              面经设置
            </CardTitle>
            <CardDescription>
              设置面经的难度、体验等额外信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">难度</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择难度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">简单</SelectItem>
                    <SelectItem value="medium">中等</SelectItem>
                    <SelectItem value="hard">困难</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">面试体验</Label>
                <Select value={formData.experience} onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择体验" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">积极</SelectItem>
                    <SelectItem value="neutral">一般</SelectItem>
                    <SelectItem value="negative">消极</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 问题选择 - 简化版 */}
        {selectedRecord && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center text-blue-800">
                <Shield className="w-5 h-5 mr-2" />
                选择分享的问题
              </CardTitle>
              <CardDescription className="text-blue-700">
                请选择要分享的面试问题（默认不选择任何问题），系统将自动进行隐私处理保护敏感信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 敏感信息检测提示 */}
              {sensitivityAdvice.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">检测到敏感信息</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {sensitivityAdvice.map((advice, index) => (
                          <li key={index}>• {advice}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 问题选择 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-medium">选择要分享的问题（请至少选择一个）</Label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllQuestions}
                    >
                      全选
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAllQuestions}
                    >
                      全不选
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {formData.questions.map((question, index) => {
                    // 优先使用已处理的隐私数据，如果没有则使用原始数据
                    const displayQuestion = privacyProcessedQuestions[index] || question
                    return (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.selectedQuestions.includes(index)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleQuestionToggle(index)}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.selectedQuestions.includes(index)}
                            onChange={() => handleQuestionToggle(index)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {typeof displayQuestion === 'string' ? displayQuestion : displayQuestion.text || displayQuestion.question}
                            </p>
                            {/* 如果使用了隐私处理的数据，显示提示 */}
                            {privacyProcessedQuestions[index] && (
                              <p className="text-xs text-gray-500 mt-1">
                                <Shield className="w-3 h-3 inline mr-1" />
                                已进行隐私处理
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  已选择 {formData.selectedQuestions.length} / {formData.questions.length} 个问题
                  {formData.selectedQuestions.length === 0 && (
                    <span className="text-red-500 ml-2">（请至少选择一个问题）</span>
                  )}
                </p>
              </div>

              {/* 预览按钮 */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  disabled={formData.selectedQuestions.length === 0}
                  className="flex items-center"
                >
                  {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showPreview ? '隐藏预览' : '预览效果'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 预览效果 */}
        {showPreview && selectedRecord && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center text-green-800">
                <Eye className="w-5 h-5 mr-2" />
                预览效果
              </CardTitle>
              <CardDescription className="text-green-700">
                这是其他用户将看到的内容（已自动进行隐私处理，只显示问题，不显示回答）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maskedPreview.questions.map((question, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-white">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {question.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


        {/* 面试建议 */}
        <Card>
          <CardHeader>
            <CardTitle>面试建议</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.tips}
              onChange={(e) => setFormData(prev => ({ ...prev, tips: e.target.value }))}
              placeholder="分享你的面试建议和心得..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* 标签 */}
        <Card>
          <CardHeader>
            <CardTitle>标签</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="输入标签"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" onClick={handleAddTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-end space-x-4">
          <Link href="/interview-sharings">
            <Button type="button" variant="outline">取消</Button>
          </Link>
          <Button 
            type="submit" 
            disabled={loading || !selectedRecord || formData.selectedQuestions.length === 0}
            className={!selectedRecord || formData.selectedQuestions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {loading ? '发布中...' : '发布面经'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewInterviewSharingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <NewInterviewSharingPageContent />
    </Suspense>
  )
}
