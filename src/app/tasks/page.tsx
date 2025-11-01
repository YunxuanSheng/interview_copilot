"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileText,
  RefreshCw,
  X
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import { toast } from "sonner"

interface Task {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  audioFileName: string
  audioFileSize: number
  estimatedDuration: number
  actualDuration: number | null
  remainingMinutes: number | null
  transcript: string | null
  error: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export default function TasksPage() {
  const { data: session, status } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  useEffect(() => {
    if (session) {
      fetchTasks()
    }
  }, [session, statusFilter])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const url = statusFilter !== 'all' 
        ? `/api/tasks/transcription?status=${statusFilter}`
        : '/api/tasks/transcription'
      const response = await fetch(url)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTasks(result.data)
        }
      }
    } catch (error) {
      console.error('获取任务列表失败:', error)
      toast.error('获取任务列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusConfig = (taskStatus: string) => {
    switch (taskStatus) {
      case 'pending':
        return {
          icon: Clock,
          label: '等待中',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }
      case 'processing':
        return {
          icon: Loader2,
          label: '处理中',
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        }
      case 'completed':
        return {
          icon: CheckCircle,
          label: '已完成',
          color: 'bg-green-100 text-green-800 border-green-200'
        }
      case 'failed':
        return {
          icon: AlertCircle,
          label: '失败',
          color: 'bg-red-100 text-red-800 border-red-200'
        }
      default:
        return {
          icon: Clock,
          label: '未知',
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

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
          <p className="text-gray-600 mb-6">登录后即可查看任务列表</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">任务列表</h1>
          <p className="text-gray-600 mt-1">查看所有录音转文字任务的状态和结果</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="筛选状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">等待中</SelectItem>
              <SelectItem value="processing">处理中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="failed">失败</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchTasks} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">暂无任务记录</p>
            <p className="text-gray-400 text-sm mt-2">去创建面试复盘并上传录音文件开始任务</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const config = getStatusConfig(task.status)
            const Icon = config.icon
            const isAnimated = task.status === 'processing' && Icon === Loader2

            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon 
                        className={cn(
                          "w-5 h-5",
                          isAnimated && "animate-spin"
                        )} 
                      />
                      <div>
                        <CardTitle className="text-lg">{task.audioFileName}</CardTitle>
                        <CardDescription className="mt-1">
                          {formatFileSize(task.audioFileSize)} · {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true, locale: zhCN })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={config.color}>
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">预计时间：</span>
                        <span className="font-medium">{task.estimatedDuration} 分钟</span>
                      </div>
                      {task.actualDuration !== null && (
                        <div>
                          <span className="text-gray-500">实际时间：</span>
                          <span className="font-medium">{task.actualDuration} 分钟</span>
                        </div>
                      )}
                      {task.remainingMinutes !== null && task.remainingMinutes > 0 && (
                        <div>
                          <span className="text-gray-500">剩余时间：</span>
                          <span className="font-medium text-blue-600">{task.remainingMinutes} 分钟</span>
                        </div>
                      )}
                      {task.status === 'processing' && task.remainingMinutes !== null && (
                        <div className="col-span-2">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full transition-all duration-500"
                              style={{
                                width: task.estimatedDuration > 0
                                  ? `${Math.max(0, Math.min(100, ((task.estimatedDuration - task.remainingMinutes) / task.estimatedDuration) * 100))}%`
                                  : '30%'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {task.status === 'failed' && task.error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md space-y-2">
                        <p className="text-sm text-red-800 font-medium">
                          <strong>错误信息：</strong>
                        </p>
                        <pre className="text-xs text-red-700 whitespace-pre-wrap font-sans">
                          {task.error}
                        </pre>
                        {task.error.includes('音频格式') && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                            <p className="text-xs text-amber-800 font-medium mb-1">💡 快速解决方案：</p>
                            <p className="text-xs text-amber-700">
                              使用 FFmpeg 转换为标准格式：
                            </p>
                            <code className="text-xs bg-amber-100 px-2 py-1 rounded block mt-1">
                              ffmpeg -i "{task.audioFileName}" -ac 1 -ar 16000 -sample_fmt s16 -f mp3 output.mp3
                            </code>
                          </div>
                        )}
                      </div>
                    )}

                    {task.status === 'completed' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTask(task)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          查看转录结果
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 转录结果对话框 */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>转录结果</CardTitle>
                  <CardDescription>{selectedTask.audioFileName}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTask(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {selectedTask.transcript ? (
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
                  {selectedTask.transcript}
                </div>
              ) : (
                <p className="text-gray-500">暂无转录结果</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
