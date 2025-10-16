"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Eye, Calendar, Building2, User, Search, Filter, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface InterviewSharing {
  id: string
  company: string
  position: string
  department?: string
  interviewDate: string | null
  round: number
  difficulty?: string
  experience?: string
  questions: any[] | string
  answers?: any[] | string
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

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function InterviewSharingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [sharings, setSharings] = useState<InterviewSharing[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchCompany, setSearchCompany] = useState("")
  const [searchPosition, setSearchPosition] = useState("")
  const [filterDifficulty, setFilterDifficulty] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [likedSharing, setLikedSharing] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("all")
  const [likedSharings, setLikedSharings] = useState<InterviewSharing[]>([])
  const [likedPagination, setLikedPagination] = useState<Pagination | null>(null)
  const [likedLoading, setLikedLoading] = useState(false)

  // 格式化日期的辅助函数，确保服务器端和客户端一致性
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未知'
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const fetchSharings = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10"
      })
      
      if (searchCompany) params.append('company', searchCompany)
      if (searchPosition) params.append('position', searchPosition)
      if (filterDifficulty && filterDifficulty !== 'all') params.append('difficulty', filterDifficulty)

      const response = await fetch(`/api/interview-sharings?${params}`)
      const data = await response.json()

      if (data.success) {
        setSharings(data.data.sharings)
        setPagination(data.data.pagination)
        setCurrentPage(page)
        
        // 如果有用户登录，检查每个分享的点赞状态
        if ((session?.user as any)?.id) {
          const likedIds = new Set<string>()
          await Promise.all(
            data.data.sharings.map(async (sharing: any) => {
              try {
                const likeResponse = await fetch(`/api/interview-sharings/${sharing.id}/like`)
                const likeData = await likeResponse.json()
                if (likeData.success && likeData.data.liked) {
                  likedIds.add(sharing.id)
                }
              } catch (error) {
                console.error(`检查分享 ${sharing.id} 点赞状态失败:`, error)
              }
            })
          )
          setLikedSharing(likedIds)
        }
      }
    } catch (error) {
      console.error('获取面试记录分享失败:', error)
    } finally {
      setLoading(false)
    }
  }, [searchCompany, searchPosition, filterDifficulty, (session?.user as any)?.id])

  const fetchLikedSharings = useCallback(async (page = 1) => {
    if (!(session?.user as any)?.id) return
    
    setLikedLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10"
      })
      
      if (searchCompany) params.append('company', searchCompany)
      if (searchPosition) params.append('position', searchPosition)
      if (filterDifficulty && filterDifficulty !== 'all') params.append('difficulty', filterDifficulty)

      const response = await fetch(`/api/interview-sharings/liked?${params}`)
      const data = await response.json()

      if (data.success) {
        setLikedSharings(data.data.sharings)
        setLikedPagination(data.data.pagination)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('获取点赞的面经失败:', error)
    } finally {
      setLikedLoading(false)
    }
  }, [searchCompany, searchPosition, filterDifficulty, (session?.user as any)?.id])

  const handleSearch = () => {
    setCurrentPage(1)
    if (activeTab === "all") {
      fetchSharings(1)
    } else {
      fetchLikedSharings(1)
    }
  }

  const handleLike = async (sharingId: string) => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    try {
      const response = await fetch(`/api/interview-sharings/${sharingId}/like`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        setLikedSharing(prev => {
          const newSet = new Set(prev)
          if (data.data.liked) {
            newSet.add(sharingId)
          } else {
            newSet.delete(sharingId)
          }
          return newSet
        })

        // 更新本地点赞数
        setSharings(prev => prev.map(sharing => 
          sharing.id === sharingId 
            ? { 
                ...sharing, 
                likeCount: data.data.liked 
                  ? sharing.likeCount + 1 
                  : sharing.likeCount - 1 
              }
            : sharing
        ))
      }
    } catch (error) {
      console.error('点赞失败:', error)
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

  useEffect(() => {
    if (activeTab === "all") {
      fetchSharings()
    } else if (activeTab === "liked" && (session?.user as any)?.id) {
      fetchLikedSharings()
    }
  }, [activeTab, fetchSharings, fetchLikedSharings, (session?.user as any)?.id])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">面经广场</h1>
            <p className="text-gray-600 mt-2">查看其他用户的面试经验，分享你的面试心得</p>
          </div>
          {session && (
            <Link href="/interview-sharings/new">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                发布面经
              </Button>
            </Link>
          )}
        </div>

        {/* 搜索和筛选 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索公司..."
                  value={searchCompany}
                  onChange={(e) => setSearchCompany(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索职位..."
                  value={searchPosition}
                  onChange={(e) => setSearchPosition(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="选择难度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部难度</SelectItem>
                  <SelectItem value="easy">简单</SelectItem>
                  <SelectItem value="medium">中等</SelectItem>
                  <SelectItem value="hard">困难</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} variant="outline" className="flex items-center gap-2 bg-white text-black border-gray-300 hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                搜索
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs 切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="all">全部面经</TabsTrigger>
          <TabsTrigger value="liked" disabled={!(session?.user as any)?.id}>
            我赞过的
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {/* 全部面经列表 */}
          {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sharings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无面经</h3>
            <p className="text-gray-500 mb-4">还没有人分享面经，成为第一个分享者吧！</p>
            {session && (
              <Link href="/interview-sharings/new">
                <Button>发布面经</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sharings.map((sharing) => (
              <Card key={sharing.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                        {sharing.company}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mb-2">{sharing.position}</p>
                      {sharing.department && (
                        <p className="text-xs text-gray-500">{sharing.department}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-1">
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
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(sharing.interviewDate)}
                      <span className="mx-2">•</span>
                      第{sharing.round}轮
                    </div>
                    
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">面试问题：</p>
                      <div className="space-y-1">
                        {(() => {
                          const questions = typeof sharing.questions === 'string' 
                            ? JSON.parse(sharing.questions) 
                            : sharing.questions || []
                          return questions.slice(0, 2).map((question: any, index: number) => (
                            <p key={index} className="text-xs text-gray-600 line-clamp-2">
                              {typeof question === 'string' ? question : question.question || question.text}
                            </p>
                          ))
                        })()}
                        {(() => {
                          const questions = typeof sharing.questions === 'string' 
                            ? JSON.parse(sharing.questions) 
                            : sharing.questions || []
                          return questions.length > 2 && (
                            <p className="text-xs text-gray-500">
                              还有{questions.length - 2}个问题...
                            </p>
                          )
                        })()}
                      </div>
                    </div>

                    {sharing.tips && (
                      <div className="text-sm">
                        <p className="font-medium text-gray-700 mb-1">面试建议：</p>
                        <p className="text-xs text-gray-600 line-clamp-2">{sharing.tips}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {sharing.viewCount}
                        </div>
                        <div className="flex items-center">
                          <Heart className="w-3 h-3 mr-1" />
                          {sharing.likeCount}
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <User className="w-3 h-3 mr-1" />
                        {sharing.user.name || '匿名用户'}
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-white text-black border-gray-300 hover:bg-gray-50"
                        onClick={() => handleLike(sharing.id)}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${likedSharing.has(sharing.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        {likedSharing.has(sharing.id) ? '已赞' : '点赞'}
                      </Button>
                      <Link href={`/interview-sharings/${sharing.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full bg-white text-black border-gray-300 hover:bg-gray-50">
                          查看详情
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 分页 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => fetchSharings(currentPage - 1)}
                  className="bg-white text-black border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  上一页
                </Button>
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant="outline"
                    onClick={() => fetchSharings(i + 1)}
                    className={currentPage === i + 1 
                      ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-700" 
                      : "bg-white text-black border-gray-300 hover:bg-gray-50"
                    }
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => fetchSharings(currentPage + 1)}
                  className="bg-white text-black border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </>
      )}
        </TabsContent>

        <TabsContent value="liked">
          {/* 我赞过的面经列表 */}
          {likedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : likedSharings.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无点赞的面经</h3>
                <p className="text-gray-500 mb-4">您还没有点赞任何面经，快去发现精彩内容吧！</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {likedSharings.map((sharing) => (
                  <Card key={sharing.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                            {sharing.company}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mb-2">{sharing.position}</p>
                          {sharing.department && (
                            <p className="text-xs text-gray-500">{sharing.department}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-1">
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
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(sharing.interviewDate)}
                          <span className="mx-2">•</span>
                          第{sharing.round}轮
                        </div>
                        
                        <div className="text-sm text-gray-700">
                          <p className="font-medium mb-1">面试问题：</p>
                          <div className="space-y-1">
                            {(() => {
                              const questions = typeof sharing.questions === 'string' 
                                ? JSON.parse(sharing.questions) 
                                : sharing.questions || []
                              return questions.slice(0, 2).map((question: any, index: number) => (
                                <p key={index} className="text-xs text-gray-600 line-clamp-2">
                                  {typeof question === 'string' ? question : question.question || question.text}
                                </p>
                              ))
                            })()}
                            {(() => {
                              const questions = typeof sharing.questions === 'string' 
                                ? JSON.parse(sharing.questions) 
                                : sharing.questions || []
                              return questions.length > 2 && (
                                <p className="text-xs text-gray-500">
                                  还有{questions.length - 2}个问题...
                                </p>
                              )
                            })()}
                          </div>
                        </div>

                        {sharing.tips && (
                          <div className="text-sm">
                            <p className="font-medium text-gray-700 mb-1">面试建议：</p>
                            <p className="text-xs text-gray-600 line-clamp-2">{sharing.tips}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {sharing.viewCount}
                            </div>
                            <div className="flex items-center">
                              <Heart className="w-3 h-3 mr-1 fill-red-500 text-red-500" />
                              {sharing.likeCount}
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <User className="w-3 h-3 mr-1" />
                            {sharing.user.name || '匿名用户'}
                          </div>
                        </div>

                        <div className="flex space-x-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-white text-black border-gray-300 hover:bg-gray-50"
                            onClick={() => handleLike(sharing.id)}
                          >
                            <Heart className="w-4 h-4 mr-1 fill-red-500 text-red-500" />
                            已赞
                          </Button>
                          <Link href={`/interview-sharings/${sharing.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full bg-white text-black border-gray-300 hover:bg-gray-50">
                              查看详情
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 分页 */}
              {likedPagination && likedPagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => fetchLikedSharings(currentPage - 1)}
                      className="bg-white text-black border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      上一页
                    </Button>
                    {[...Array(likedPagination.totalPages)].map((_, i) => (
                      <Button
                        key={i + 1}
                        variant="outline"
                        onClick={() => fetchLikedSharings(i + 1)}
                        className={currentPage === i + 1 
                          ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-700" 
                          : "bg-white text-black border-gray-300 hover:bg-gray-50"
                        }
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      disabled={currentPage === likedPagination.totalPages}
                      onClick={() => fetchLikedSharings(currentPage + 1)}
                      className="bg-white text-black border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
