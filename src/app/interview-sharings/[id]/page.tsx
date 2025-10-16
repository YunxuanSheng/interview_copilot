"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Eye, Calendar, Building2, User, ArrowLeft, Edit, Trash2, Share2 } from "lucide-react"
import Link from "next/link"

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
  viewCount: number
  likeCount: number
  createdAt: string
  user: {
    id: string
    name?: string
    image?: string
  }
}

export default function InterviewSharingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const resolvedParams = use(params)
  const [sharing, setSharing] = useState<InterviewSharing | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchSharing = useCallback(async () => {
    try {
      const response = await fetch(`/api/interview-sharings/${resolvedParams.id}`)
      const data = await response.json()

      if (data.success) {
        setSharing(data.data)
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

  const checkLikeStatus = useCallback(async () => {
    if (!session) return

    try {
      const response = await fetch(`/api/interview-sharings/${resolvedParams.id}/like`)
      const data = await response.json()

      if (data.success) {
        setLiked(data.data.liked)
      }
    } catch (error) {
      console.error('检查点赞状态失败:', error)
    }
  }, [resolvedParams.id, session])

  useEffect(() => {
    fetchSharing()
    checkLikeStatus()
  }, [fetchSharing, checkLikeStatus])

  const handleLike = async () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    try {
      const response = await fetch(`/api/interview-sharings/${resolvedParams.id}/like`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        setLiked(data.data.liked)
        setSharing(prev => prev ? {
          ...prev,
          likeCount: data.data.liked ? prev.likeCount + 1 : prev.likeCount - 1
        } : null)
      }
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  const handleDelete = async () => {
    if (!sharing || !session || sharing.user.id !== (session.user as any)?.id) return

    if (!confirm('确定要删除这个面试记录分享吗？此操作不可撤销。')) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/interview-sharings/${resolvedParams.id}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        router.push('/interview-sharings')
      } else {
        alert(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    } finally {
      setDeleting(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${sharing?.company} - ${sharing?.position} 面试记录`,
          text: `查看 ${sharing?.company} ${sharing?.position} 的面试记录分享`,
          url: window.location.href
        })
      } catch (error) {
        console.error('分享失败:', error)
      }
    } else {
      // 复制链接到剪贴板
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('链接已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
      }
    }
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getExperienceColor = (experience?: string) => {
    switch (experience) {
      case 'positive': return 'bg-green-100 text-green-800'
      case 'neutral': return 'bg-gray-100 text-gray-800'
      case 'negative': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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

  if (!sharing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">面经不存在</h3>
            <p className="text-gray-500 mb-4">该面经可能已被删除或不存在</p>
            <Link href="/interview-sharings">
              <Button>返回列表</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwner = (session?.user as any)?.id === sharing.user.id

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <Link href="/interview-sharings" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回列表
        </Link>
      </div>

      <div className="space-y-6">
        {/* 头部信息 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {sharing.company}
                </CardTitle>
                <p className="text-lg text-gray-600 mb-2">{sharing.position}</p>
                {sharing.department && (
                  <p className="text-sm text-gray-500">{sharing.department}</p>
                )}
              </div>
              <div className="flex flex-col items-end space-y-2">
                {sharing.difficulty && (
                  <Badge className={getDifficultyColor(sharing.difficulty)}>
                    {sharing.difficulty === 'easy' ? '简单' : 
                     sharing.difficulty === 'medium' ? '中等' : '困难'}
                  </Badge>
                )}
                {sharing.experience && (
                  <Badge className={getExperienceColor(sharing.experience)}>
                    {sharing.experience === 'positive' ? '积极' : 
                     sharing.experience === 'neutral' ? '一般' : '消极'}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(sharing.interviewDate).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <span>第{sharing.round}轮</span>
                </div>
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {sharing.viewCount} 次浏览
                </div>
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  {sharing.likeCount} 个赞
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLike}
                  className={liked ? 'text-red-500 border-red-500' : ''}
                >
                  <Heart className={`w-4 h-4 mr-1 ${liked ? 'fill-current' : ''}`} />
                  {liked ? '已赞' : '点赞'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-1" />
                  分享
                </Button>
                {isOwner && (
                  <>
                    <Link href={`/interview-sharings/${sharing.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        编辑
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="text-red-500 border-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {deleting ? '删除中...' : '删除'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 作者信息 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {sharing.user.name || '匿名用户'}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(sharing.createdAt).toLocaleDateString()} 发布
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 面试问题 */}
        <Card>
          <CardHeader>
            <CardTitle>面试问题</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sharing.questions.map((question, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-2">
                        {typeof question === 'string' ? question : question.text || question.question}
                      </p>
                      {sharing.answers && sharing.answers[index] ? (
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p className="font-medium text-gray-700 mb-1">我的回答：</p>
                          <p className="text-gray-600">
                            {typeof sharing.answers[index] === 'string' 
                              ? sharing.answers[index] 
                              : sharing.answers[index].text}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-blue-50 p-3 rounded text-sm border border-blue-200">
                          <p className="text-blue-700 text-sm">
                            💡 作者选择不分享回答内容，保护个人隐私
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

        {/* 面试建议 */}
        {sharing.tips && (
          <Card>
            <CardHeader>
              <CardTitle>面试建议</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{sharing.tips}</p>
            </CardContent>
          </Card>
        )}

        {/* 标签 */}
        {sharing.tags && (
          <Card>
            <CardHeader>
              <CardTitle>标签</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {sharing.tags.split(',').map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
