"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowLeft, X, Plus, Shield, Eye, EyeOff, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { maskSensitiveInfo, hasSensitiveInfo, getSensitivityAdvice } from "@/lib/privacy-utils"

interface InterviewSharing {
  id: string
  company: string
  position: string
  department?: string
  interviewDate: string
  round: number
  difficulty?: string
  experience?: string
  questions: any[]
  answers?: any[]
  tips?: string
  tags?: string
  isPublic: boolean
  // 隐私设置
  selectedQuestions?: string
  enableAnswerSharing?: boolean
  enablePersonalInfo?: boolean
  user: {
    id: string
    name?: string
    image?: string
  }
}

export default function EditInterviewSharingPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const resolvedParams = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState<InterviewSharing | null>(null)
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
    // 隐私设置
    selectedQuestions: [] as number[],
    enableAnswerSharing: false, // 默认不分享回答，保护隐私
    enablePersonalInfo: false
  })
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [newTag, setNewTag] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [sensitivityAdvice, setSensitivityAdvice] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const fetchSharing = useCallback(async () => {
    try {
      const response = await fetch(`/api/interview-sharings/${resolvedParams.id}`)
      const data = await response.json()

      if (data.success) {
        const sharingData = data.data
        setSharing(sharingData)
        
        // 解析选中的问题索引
        const selectedQuestions = sharingData.selectedQuestions 
          ? JSON.parse(sharingData.selectedQuestions) 
          : Array.from({ length: (sharingData.questions || []).length }, (_, i) => i)
        
        setFormData({
          company: sharingData.company,
          position: sharingData.position,
          department: sharingData.department || "",
          interviewDate: new Date(sharingData.interviewDate).toISOString().split('T')[0],
          round: sharingData.round,
          difficulty: sharingData.difficulty || "",
          experience: sharingData.experience || "",
          questions: sharingData.questions || [],
          answers: sharingData.answers || [],
          tips: sharingData.tips || "",
          tags: sharingData.tags || "",
          isPublic: sharingData.isPublic,
          // 隐私设置
          selectedQuestions: selectedQuestions,
          enableAnswerSharing: sharingData.enableAnswerSharing || false,
          enablePersonalInfo: sharingData.enablePersonalInfo || false
        })
        
        if (sharingData.tags) {
          setTags(sharingData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag))
        }
        
        // 检测敏感信息
        const allText = [
          sharingData.company,
          sharingData.position,
          ...(sharingData.questions || []).map((q: any) => typeof q === 'string' ? q : q.text || q.question || ''),
          ...(sharingData.answers || []).map((a: any) => typeof a === 'string' ? a : a.text || '')
        ].join(' ')
        
        const advice = getSensitivityAdvice(allText)
        setSensitivityAdvice(advice)
      } else {
        router.push('/interview-sharings')
      }
    } catch (error) {
      console.error('获取面试记录分享失败:', error)
      router.push('/interview-sharings')
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id, router])

  useEffect(() => {
    fetchSharing()
  }, [fetchSharing])

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, { text: newQuestion.trim(), type: 'custom' }]
      }))
      setNewQuestion("")
    }
  }

  const handleRemoveQuestion = (index: number) => {
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

  // 获取脱敏后的内容预览
  const getMaskedPreview = () => {
    const selectedQuestions = formData.questions.filter((_, index) => 
      formData.selectedQuestions.includes(index)
    )
    const selectedAnswers = formData.answers.filter((_, index) => 
      formData.selectedQuestions.includes(index)
    )
    
    return {
      questions: selectedQuestions.map(q => ({
        ...q,
        text: formData.enablePersonalInfo 
          ? maskSensitiveInfo(typeof q === 'string' ? q : q.text || q.question || '')
          : maskSensitiveInfo(typeof q === 'string' ? q : q.text || q.question || '')
      })),
      answers: formData.enableAnswerSharing ? selectedAnswers.map(a => ({
        ...a,
        text: formData.enablePersonalInfo 
          ? maskSensitiveInfo(typeof a === 'string' ? a : a.text || '')
          : maskSensitiveInfo(typeof a === 'string' ? a : a.text || '')
      })) : []
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.company || !formData.position || formData.questions.length === 0) {
      alert('请填写公司、职位和至少一个问题')
      return
    }

    if (formData.selectedQuestions.length === 0) {
      alert('请至少选择一个问题进行分享')
      return
    }

    setSaving(true)
    try {
      // 准备脱敏后的内容
      const maskedPreview = getMaskedPreview()
      
      const response = await fetch(`/api/interview-sharings/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          interviewDate: new Date(formData.interviewDate).toISOString(),
          // 只发送选中的问题
          questions: maskedPreview.questions,
          answers: maskedPreview.answers,
          // 隐私设置
          selectedQuestions: JSON.stringify(formData.selectedQuestions),
          enableAnswerSharing: formData.enableAnswerSharing,
          enablePersonalInfo: formData.enablePersonalInfo
        })
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/interview-sharings/${resolvedParams.id}`)
      } else {
        alert(data.error || '更新失败')
      }
    } catch (error) {
      console.error('更新失败:', error)
      alert('更新失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!sharing || !session || sharing.user.id !== (session.user as any)?.id) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">无权限编辑</h3>
            <p className="text-gray-500 mb-4">你只能编辑自己的面经</p>
            <Link href="/interview-sharings">
              <Button>返回列表</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <Link href={`/interview-sharings/${resolvedParams.id}`} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回详情
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">编辑面经</h1>
        <p className="text-gray-600 mt-2">修改你的面经内容</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">公司名称 *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="请输入公司名称"
                  required
                />
              </div>
              <div>
                <Label htmlFor="position">职位 *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="请输入职位名称"
                  required
                />
              </div>
              <div>
                <Label htmlFor="department">部门</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="请输入部门名称"
                />
              </div>
              <div>
                <Label htmlFor="interviewDate">面试日期 *</Label>
                <Input
                  id="interviewDate"
                  type="date"
                  value={formData.interviewDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, interviewDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="round">面试轮次</Label>
                <Input
                  id="round"
                  type="number"
                  min="1"
                  value={formData.round}
                  onChange={(e) => setFormData(prev => ({ ...prev, round: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
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
              <div>
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
              <div>
                <Label htmlFor="isPublic">公开状态</Label>
                <Select value={formData.isPublic ? "true" : "false"} onValueChange={(value) => setFormData(prev => ({ ...prev, isPublic: value === "true" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择公开状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">公开</SelectItem>
                    <SelectItem value="false">私有</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 隐私设置 */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <Shield className="w-5 h-5 mr-2" />
              隐私设置
            </CardTitle>
            <CardDescription className="text-orange-700">
              保护您的个人信息，建议只分享面试问题，不分享回答内容
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                <Label className="text-base font-medium">选择要分享的问题</Label>
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
                {formData.questions.map((question, index) => (
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
                          {typeof question === 'string' ? question : question.text || question.question}
                        </p>
                        {formData.answers[index] && (
                          <p className="text-xs text-gray-500 mt-1">
                            包含回答内容
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                已选择 {formData.selectedQuestions.length} / {formData.questions.length} 个问题
              </p>
            </div>

            {/* 分享设置 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="enableAnswerSharing"
                  checked={formData.enableAnswerSharing}
                  onChange={(e) => setFormData(prev => ({ ...prev, enableAnswerSharing: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="enableAnswerSharing" className="flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  分享我的回答内容（不推荐，可能包含个人信息）
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="enablePersonalInfo"
                  checked={formData.enablePersonalInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, enablePersonalInfo: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="enablePersonalInfo" className="flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  允许分享个人信息（仍会进行脱敏处理）
                </Label>
              </div>
            </div>

            {/* 预览按钮 */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center"
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPreview ? '隐藏预览' : '预览效果'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 预览效果 */}
        {showPreview && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <Eye className="w-5 h-5 mr-2" />
                预览效果
              </CardTitle>
              <CardDescription className="text-green-700">
                这是其他用户将看到的内容
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getMaskedPreview().questions.map((question, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-white">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">
                          {question.text}
                        </p>
                        {formData.enableAnswerSharing && getMaskedPreview().answers[index] && (
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <p className="font-medium text-gray-700 mb-1">我的回答：</p>
                            <p className="text-gray-600">
                              {getMaskedPreview().answers[index].text}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 面试问题 */}
        <Card>
          <CardHeader>
            <CardTitle>面试问题 *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {formData.questions.map((question, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium mb-2">
                        {typeof question === 'string' ? question : question.text || question.question}
                      </p>
                      {formData.answers[index] && (
                        <div className="bg-gray-50 p-2 rounded text-sm">
                          <strong>我的回答：</strong>
                          <p>{typeof formData.answers[index] === 'string' ? formData.answers[index] : formData.answers[index].text}</p>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveQuestion(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>添加问题</Label>
              <div className="flex space-x-2">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="输入面试问题"
                />
                <Button type="button" onClick={handleAddQuestion}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
          <Link href={`/interview-sharings/${resolvedParams.id}`}>
            <Button type="button" variant="outline">取消</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? '保存中...' : '保存更改'}
          </Button>
        </div>
      </form>
    </div>
  )
}
