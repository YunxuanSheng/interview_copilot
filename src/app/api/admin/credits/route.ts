import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { addCredits } from "@/lib/credits"

// 获取所有用户的 Credits 统计
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  
  if ("error" in authResult) {
    return authResult.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")

    // 获取所有用户的 Credits 信息
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
      orderBy: {
        creditsBalance: "desc"
      },
      take: limit
    })

    // 获取统计信息
    const [totalCredits, totalDailyUsed, totalMonthlyUsed, totalUsers] = await Promise.all([
      prisma.userCredits.aggregate({
        _sum: {
          creditsBalance: true
        }
      }),
      prisma.userCredits.aggregate({
        _sum: {
          dailyUsed: true
        }
      }),
      prisma.userCredits.aggregate({
        _sum: {
          monthlyUsed: true
        }
      }),
      prisma.userCredits.count()
    ])

    // Credits 排行榜
    const creditsRanking = userCredits.map((uc, index) => ({
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
          totalCredits: totalCredits._sum.creditsBalance || 0,
          totalDailyUsed: totalDailyUsed._sum.dailyUsed || 0,
          totalMonthlyUsed: totalMonthlyUsed._sum.monthlyUsed || 0,
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

