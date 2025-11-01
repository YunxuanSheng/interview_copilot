import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 获取未读通知
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: '请先登录'
      }, { status: 401 })
    }

    // 查询已完成但未读的转录任务
    const unreadTasks = await prisma.audioTranscriptionTask.findMany({
      where: {
        userId,
        status: 'completed',
        readAt: null, // 未读
        completedAt: { not: null } // 已完成
      },
      orderBy: { completedAt: 'desc' },
      take: 50
    })

    // 格式化通知数据
    const notifications = unreadTasks.map(task => ({
      id: task.id,
      type: 'transcription_completed',
      title: '转文字完成',
      message: `文件 "${task.audioFileName}" 转录已完成`,
      taskId: task.id,
      audioFileName: task.audioFileName,
      completedAt: task.completedAt?.toISOString() || null,
      createdAt: task.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount: notifications.length
      }
    })
  } catch (error) {
    console.error('获取通知失败:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: '获取通知失败，请稍后重试'
    }, { status: 500 })
  }
}

// 标记通知为已读
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: '请先登录'
      }, { status: 401 })
    }

    const body = await request.json()
    const { taskId } = body

    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: '缺少taskId参数'
      }, { status: 400 })
    }

    // 更新任务的readAt字段
    await prisma.audioTranscriptionTask.updateMany({
      where: {
        id: taskId,
        userId // 确保只能标记自己的任务
      },
      data: {
        readAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: '已标记为已读'
    })
  } catch (error) {
    console.error('标记通知已读失败:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: '操作失败，请稍后重试'
    }, { status: 500 })
  }
}

