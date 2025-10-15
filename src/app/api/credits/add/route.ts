import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { addCredits } from '@/lib/credits'

// 补充credits（测试用）
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

    const { amount = 100 } = await request.json()
    
    if (amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid amount',
        message: '请提供有效的补充数量'
      }, { status: 400 })
    }

    const success = await addCredits(session.user.id, amount)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `成功补充 ${amount} credits`,
        data: { amount }
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
