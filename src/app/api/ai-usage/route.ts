import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 获取用户AI使用统计
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: '请先登录'
      }, { status: 401 })
    }

    const userId = session.user.id

    // 获取用户的所有AI使用统计
    const usageStats = await prisma.aiUsageStat.findMany({
      where: { userId },
      orderBy: { serviceType: 'asc' }
    })

    // 转换为更友好的格式
    const stats = {
      interview_analysis: 0,
      audio_transcription: 0,
      suggestion_generation: 0,
      job_parsing: 0,
      total: 0
    }

    usageStats.forEach(stat => {
      const serviceType = stat.serviceType as keyof typeof stats
      if (serviceType in stats) {
        stats[serviceType] = stat.count
        stats.total += stat.count
      }
    })

    return NextResponse.json({
      success: true,
      data: stats,
      message: '获取使用统计成功'
    })

  } catch (error) {
    console.error('获取AI使用统计失败:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: '获取使用统计失败'
    }, { status: 500 })
  }
}

// 增加AI使用计数
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: '请先登录'
      }, { status: 401 })
    }

    const { serviceType } = await request.json()
    
    if (!serviceType) {
      return NextResponse.json({
        success: false,
        error: 'Missing serviceType',
        message: '请提供服务类型'
      }, { status: 400 })
    }

    const validServiceTypes = ['interview_analysis', 'audio_transcription', 'suggestion_generation', 'job_parsing']
    if (!validServiceTypes.includes(serviceType)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid serviceType',
        message: '无效的服务类型'
      }, { status: 400 })
    }

    const userId = session.user.id

    // 使用 upsert 来增加计数
    const updatedStat = await prisma.aiUsageStat.upsert({
      where: {
        userId_serviceType: {
          userId,
          serviceType
        }
      },
      update: {
        count: {
          increment: 1
        },
        lastUsed: new Date()
      },
      create: {
        userId,
        serviceType,
        count: 1,
        lastUsed: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedStat,
      message: '使用计数更新成功'
    })

  } catch (error) {
    console.error('更新AI使用计数失败:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: '更新使用计数失败'
    }, { status: 500 })
  }
}
