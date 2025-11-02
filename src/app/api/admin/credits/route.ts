import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { addCredits, getCreditsStatus } from "@/lib/credits"

// 获取所有用户的 Credits 统计
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  
  if ("error" in authResult) {
    return authResult.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")

    // 获取所有用户的 Credits 信息（先获取基础数据）
    const userCredits = await prisma.userCredits.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      take: limit * 2 // 多获取一些，因为排序可能变化
    })

    // 使用 getCreditsStatus 获取最新的credits状态（确保数据准确）
    const creditsWithStatus = await Promise.all(
      userCredits.map(async (uc) => {
        try {
          const status = await getCreditsStatus(uc.userId)
          return {
            ...uc,
            creditsBalance: status.creditsBalance,
            dailyUsed: status.dailyUsed,
            monthlyUsed: status.monthlyUsed
          }
        } catch (error) {
          console.error(`获取用户 ${uc.userId} 的credits状态失败:`, error)
          return uc
        }
      })
    )

    // 按最新余额排序
    creditsWithStatus.sort((a, b) => b.creditsBalance - a.creditsBalance)

    // 只取前 limit 名
    const topCredits = creditsWithStatus.slice(0, limit)

    // 获取统计信息（从最新数据计算）
    const totalCredits = topCredits.reduce((sum, uc) => sum + uc.creditsBalance, 0)
    const totalDailyUsed = topCredits.reduce((sum, uc) => sum + uc.dailyUsed, 0)
    const totalMonthlyUsed = topCredits.reduce((sum, uc) => sum + uc.monthlyUsed, 0)
    
    // 获取全部用户的统计（用于显示总体数据）
    const [allCreditsStats, totalUsers] = await Promise.all([
      prisma.userCredits.aggregate({
        _sum: {
          creditsBalance: true,
          dailyUsed: true,
          monthlyUsed: true
        }
      }),
      prisma.userCredits.count()
    ])

    // Credits 排行榜
    const creditsRanking = topCredits.map((uc, index) => ({
      rank: index + 1,
      userId: uc.userId,
      email: uc.user.email,
      name: uc.user.name,
      role: uc.user.role,
      creditsBalance: uc.creditsBalance,
      dailyUsed: uc.dailyUsed,
      monthlyUsed: uc.monthlyUsed
    }))

    return NextResponse.json({
      success: true,
      data: {
        ranking: creditsRanking,
        stats: {
          totalCredits: allCreditsStats._sum.creditsBalance || 0,
          totalDailyUsed: allCreditsStats._sum.dailyUsed || 0,
          totalMonthlyUsed: allCreditsStats._sum.monthlyUsed || 0,
          totalUsers
        }
      }
    })
  } catch (error) {
    console.error("获取 Credits 统计失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "获取 Credits 统计失败"
      },
      { status: 500 }
    )
  }
}

// 调整用户 Credits
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request)
  
  if ("error" in authResult) {
    return authResult.error
  }

  try {
    const body = await request.json()
    const { userId, amount, action } = body // action: "add" | "set"

    if (!userId || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          message: "缺少用户ID或数量"
        },
        { status: 400 }
      )
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "用户不存在"
        },
        { status: 404 }
      )
    }

    if (action === "set") {
      // 直接设置 Credits
      const userCredits = await prisma.userCredits.findUnique({
        where: { userId }
      })

      if (!userCredits) {
        // 创建 Credits 记录
        await prisma.userCredits.create({
          data: {
            userId,
            creditsBalance: amount,
            dailyUsed: 0,
            monthlyUsed: 0
          }
        })
      } else {
        await prisma.userCredits.update({
          where: { userId },
          data: {
            creditsBalance: amount
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: `成功设置用户 Credits 为 ${amount}`,
        data: {
          userId,
          email: user.email,
          creditsBalance: amount
        }
      })
    } else {
      // 增加 Credits
      const success = await addCredits(userId, amount)
      
      if (success) {
        const updatedCredits = await prisma.userCredits.findUnique({
          where: { userId },
          select: { creditsBalance: true }
        })

        return NextResponse.json({
          success: true,
          message: `成功为用户增加 ${amount} Credits`,
          data: {
            userId,
            email: user.email,
            creditsBalance: updatedCredits?.creditsBalance || 0
          }
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to add credits",
            message: "增加 Credits 失败"
          },
          { status: 500 }
        )
      }
    }
  } catch (error) {
    console.error("调整 Credits 失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "调整 Credits 失败"
      },
      { status: 500 }
    )
  }
}

