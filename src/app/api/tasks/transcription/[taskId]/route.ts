import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
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

    const { taskId } = await params

    // 查询任务
    const task = await prisma.audioTranscriptionTask.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json({
        success: false,
        error: 'Task not found',
        message: '任务不存在'
      }, { status: 404 })
    }

    // 检查任务是否属于当前用户
    if (task.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden',
        message: '无权访问此任务'
      }, { status: 403 })
    }

    // 计算剩余预计时间
    let remainingMinutes: number | null = null
    if (task.status === 'pending' || task.status === 'processing') {
      const elapsedMinutes = Math.floor((Date.now() - task.createdAt.getTime()) / 1000 / 60)
      remainingMinutes = Math.max(0, task.estimatedDuration - elapsedMinutes)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        status: task.status,
        audioFileName: task.audioFileName,
        audioFileSize: task.audioFileSize,
        estimatedDuration: task.estimatedDuration,
        actualDuration: task.actualDuration,
        remainingMinutes,
        transcript: task.transcript,
        error: task.error,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        completedAt: task.completedAt?.toISOString() || null
      },
      message: '查询成功'
    })
  } catch (error) {
    console.error('查询任务状态失败:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: '查询失败，请稍后重试'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
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

    const { taskId } = await params

    // 查询任务
    const task = await prisma.audioTranscriptionTask.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json({
        success: false,
        error: 'Task not found',
        message: '任务不存在'
      }, { status: 404 })
    }

    // 检查任务是否属于当前用户
    if (task.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden',
        message: '无权删除此任务'
      }, { status: 403 })
    }

    // 删除任务（如果音频文件还存在，也尝试删除）
    try {
      if (task.audioFilePath) {
        const { unlink } = await import('fs/promises')
        try {
          await unlink(task.audioFilePath)
        } catch (fileError) {
          // 文件可能已经被删除，忽略错误
          console.warn(`删除任务音频文件失败: ${task.audioFilePath}`, fileError)
        }
      }
    } catch (fileError) {
      // 忽略文件删除错误，继续删除数据库记录
      console.warn('删除音频文件时出错:', fileError)
    }

    // 删除数据库记录
    await prisma.audioTranscriptionTask.delete({
      where: { id: taskId }
    })

    return NextResponse.json({
      success: true,
      message: '任务已删除'
    })
  } catch (error) {
    console.error('删除任务失败:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: '删除失败，请稍后重试'
    }, { status: 500 })
  }
}
