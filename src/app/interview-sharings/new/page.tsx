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
import { Calendar, Building2, User, Plus, X, ArrowLeft, Mic } from "lucide-react"
import Link from "next/link"

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
    isPublic: true
  })
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [newTag, setNewTag] = useState("")
  const [tags, setTags] = useState<string[]>([])

  // 获取URL参数中的面试记录ID
  useEffect(() => {
    const interviewRecordId = searchParams.get('interviewRecordId')
    if (interviewRecordId) {
      setPreSelectedRecordId(interviewRecordId)
    }
  }, [searchParams])

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
  }, [preSelectedRecordId])

  // 获取用户的面试记录
  useEffect(() => {
    if ((session?.user as any)?.id) {
      fetchInterviewRecords()
    }
  }, [session, preSelectedRecordId, fetchInterviewRecords])

  const handleSelectRecord = (record: InterviewRecord) => {
    setSelectedRecord(record)
    setFormData(prev => ({
      ...prev,
      company: record.company,
      position: record.position,
      interviewDate: record.interviewDate,
      questions: record.questions || [],
      answers: record.answers || []
    }))
  }

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

    setLoading(true)
    try {
      const response = await fetch('/api/interview-sharings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          interviewRecordId: selectedRecord?.id,
          interviewDate: new Date(formData.interviewDate).toISOString()
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
                      isPublic: true
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
            <CardHeader>
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
            <CardHeader>
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
                <div>
                  <Label>公司名称</Label>
                  <Input
                    value={formData.company}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label>职位</Label>
                  <Input
                    value={formData.position}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label>面试日期</Label>
                  <Input
                    value={new Date(formData.interviewDate).toLocaleDateString()}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label>面试轮次</Label>
                  <Input
                    value={`第${formData.round}轮`}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 面经设置 */}
        <Card>
          <CardHeader>
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
            </div>
          </CardContent>
        </Card>

        {/* 面试问题 - 只读显示 */}
        {selectedRecord && (
          <Card>
            <CardHeader>
              <CardTitle>面试问题</CardTitle>
              <CardDescription>
                以下问题来自您选择的面试复盘记录，将作为面经内容分享
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formData.questions.map((question, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-2 text-gray-900">
                          {typeof question === 'string' ? question : question.text || question.question}
                        </p>
                        {formData.answers && formData.answers[index] && (
                          <div className="bg-white p-3 rounded border text-sm">
                            <strong className="text-gray-700">我的回答：</strong>
                            <p className="text-gray-600 mt-1">
                              {typeof formData.answers[index] === 'string' 
                                ? formData.answers[index] 
                                : formData.answers[index].text}
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
            disabled={loading || !selectedRecord}
            className={!selectedRecord ? 'opacity-50 cursor-not-allowed' : ''}
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
