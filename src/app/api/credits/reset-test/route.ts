import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 重置测试用户credits到2000
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

    const userId = session.user.id

    // 更新或创建用户credits记录，设置为2000
    await prisma.userCredits.upsert({
      where: { userId },
      update: {
        creditsBalance: 2000,
        dailyUsed: 0,
        monthlyUsed: 0,
        lastDailyReset: new Date(),
        lastMonthlyReset: new Date()
      },
      create: {
        userId,
        creditsBalance: 2000,
        dailyUsed: 0,
        monthlyUsed: 0,
        lastDailyReset: new Date(),
        lastMonthlyReset: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: '测试credits已重置为2000',
      data: { creditsBalance: 2000 }
    })

  } catch (error) {
    console.error('重置测试credits失败:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: '重置credits失败'
    }, { status: 500 })
  }
}
