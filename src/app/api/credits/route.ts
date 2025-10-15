import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCreditsStatus, addCredits } from '@/lib/credits'

// 获取用户credits状态
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
    const creditsStatus = await getCreditsStatus(userId)

    return NextResponse.json({
      success: true,
      data: creditsStatus,
      message: '获取credits状态成功'
    })

  } catch (error) {
    console.error('获取credits状态失败:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: '获取credits状态失败'
    }, { status: 500 })
  }
}

// 补充credits（管理员功能）
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

    const { amount, targetUserId } = await request.json()
    
    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid amount',
        message: '请提供有效的补充数量'
      }, { status: 400 })
    }

    // 这里可以添加管理员权限检查
    // 暂时允许用户给自己补充credits（测试用）
    const userId = targetUserId || session.user.id

    const success = await addCredits(userId, amount)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `成功补充 ${amount} credits`
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to add credits',
        message: '补充credits失败'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('补充credits失败:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: '补充credits失败'
    }, { status: 500 })
  }
}
