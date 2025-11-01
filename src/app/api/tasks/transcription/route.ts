import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 可选：过滤状态

    // 构建查询条件
    const where: any = { userId }
    if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
      where.status = status
    }

    // 查询任务列表，包含关联的schedule信息
    const tasks = await prisma.audioTranscriptionTask.findMany({
      where,
      include: {
        schedule: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // 限制最多100条
    })

    // 格式化返回数据
    const formattedTasks = tasks.map(task => {
      let remainingMinutes: number | null = null
      if (task.status === 'pending' || task.status === 'processing') {
        const elapsedMinutes = Math.floor((Date.now() - task.createdAt.getTime()) / 1000 / 60)
        remainingMinutes = Math.max(0, task.estimatedDuration - elapsedMinutes)
      }

      return {
        id: task.id,
        status: task.status,
        audioFileName: task.audioFileName,
        audioFileSize: task.audioFileSize,
        estimatedDuration: task.estimatedDuration,
        actualDuration: task.actualDuration,
        remainingMinutes,
        transcript: task.transcript,
        error: task.error,
        scheduleId: task.scheduleId,
        schedule: task.schedule ? {
          id: task.schedule.id,
          company: task.schedule.company,
          position: task.schedule.position,
          round: task.schedule.round,
          interviewDate: task.schedule.interviewDate.toISOString()
        } : null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        completedAt: task.completedAt?.toISOString() || null
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedTasks,
      message: '查询成功'
    })
  } catch (error) {
    console.error('查询任务列表失败:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: '查询失败，请稍后重试'
    }, { status: 500 })
  }
}
