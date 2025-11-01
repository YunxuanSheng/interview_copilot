"use client"

import { useEffect, useState, useRef } from "react"
import { X, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TaskStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  audioFileName: string
  estimatedDuration: number
  actualDuration: number | null
  remainingMinutes: number | null
  transcript: string | null
  error: string | null
}

interface TaskBannerProps {
  taskId: string | null
  onClose?: () => void
  onComplete?: (transcript: string) => void
}

export function TaskBanner({ taskId, onClose, onComplete }: TaskBannerProps) {
  const [task, setTask] = useState<TaskStatus | null>(null)
  const hasCalledCompleteRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  // 更新onComplete的ref，但不触发重新渲染
  useEffect(() => {
    onCompleteRef.current = onComplete
    hasCalledCompleteRef.current = false // 重置标记，如果taskId改变
  }, [onComplete, taskId])

  // 轮询任务状态
  useEffect(() => {
    if (!taskId) {
      setTask(null)
      hasCalledCompleteRef.current = false
      return
    }
    
    hasCalledCompleteRef.current = false // 重置标记
    
    const pollTaskStatus = async () => {
      try {
        const response = await fetch(`/api/tasks/transcription/${taskId}`)
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            const newTask = result.data
            setTask(newTask)
            
            // 如果任务完成，调用onComplete（只调用一次）
            if (newTask.status === 'completed' && newTask.transcript && onCompleteRef.current && !hasCalledCompleteRef.current) {
              hasCalledCompleteRef.current = true
              onCompleteRef.current(newTask.transcript)
            }
            
            // 如果任务完成或失败，停止轮询
            if (newTask.status === 'completed' || newTask.status === 'failed') {
              return false // 返回false表示停止轮询
            }
            return true // 继续轮询
          }
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error)
      }
      return true // 出错时也继续轮询
    }

    // 立即查询一次
    pollTaskStatus().then(shouldContinue => {
      if (!shouldContinue) return
    })

    // 设置轮询间隔
    const interval = setInterval(async () => {
      const shouldContinue = await pollTaskStatus()
      if (!shouldContinue) {
        clearInterval(interval)
      }
    }, 3000) // 统一使用3秒间隔

    return () => {
      clearInterval(interval)
    }
  }, [taskId])

  if (!taskId || !task) {
    return null
  }

  const getStatusConfig = () => {
    switch (task.status) {
      case 'pending':
        return {
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-900',
          iconColor: 'text-blue-600',
          icon: Clock,
          title: '任务已提交',
          message: '正在等待处理...'
        }
      case 'processing':
        return {
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-900',
          iconColor: 'text-blue-600',
          icon: Loader2,
          title: '正在处理中',
          message: task.remainingMinutes !== null 
            ? `预计还需 ${task.remainingMinutes} 分钟`
            : '正在转录音频...'
        }
      case 'completed':
        return {
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-900',
          iconColor: 'text-green-600',
          icon: CheckCircle,
          title: '处理完成',
          message: task.actualDuration 
            ? `实际耗时 ${task.actualDuration} 分钟`
            : '转录已完成'
        }
      case 'failed':
        return {
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-900',
          iconColor: 'text-red-600',
          icon: AlertCircle,
          title: '处理失败',
          message: task.error || '转录过程中出现错误'
        }
      default:
        return null
    }
  }

  const config = getStatusConfig()
  if (!config) return null

  const Icon = config.icon
  const isAnimated = task.status === 'processing' && Icon === Loader2

  return (
    <div className={cn(
      "sticky top-0 z-50 w-full border-b px-4 py-3 shadow-sm",
      config.bgColor
    )}>
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon 
            className={cn(
              "w-5 h-5 flex-shrink-0",
              config.iconColor,
              isAnimated && "animate-spin"
            )} 
          />
          <div className="flex-1 min-w-0">
            <div className={cn("font-medium", config.textColor)}>
              {config.title}
            </div>
            <div className={cn("text-sm mt-0.5", config.textColor, "opacity-80")}>
              {config.message}
              {task.status === 'processing' && task.remainingMinutes !== null && task.remainingMinutes > 0 && (
                <span className="ml-2">· 预计总时长 {task.estimatedDuration} 分钟</span>
              )}
            </div>
            {task.status === 'processing' && (
              <div className="mt-2 w-full max-w-md">
                <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{
                      width: task.remainingMinutes !== null && task.estimatedDuration > 0
                        ? `${Math.max(0, Math.min(100, ((task.estimatedDuration - task.remainingMinutes) / task.estimatedDuration) * 100))}%`
                        : '30%'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {task.status === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (task.transcript && onComplete) {
                  onComplete(task.transcript)
                }
              }}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              查看结果
            </Button>
          )}
          {task.status === 'failed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // 这里可以添加重试逻辑
                if (onClose) onClose()
              }}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              关闭
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={cn(
                "h-8 w-8 p-0",
                config.textColor,
                "hover:bg-opacity-20"
              )}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
