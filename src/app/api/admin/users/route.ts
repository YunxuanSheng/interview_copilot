import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// 获取用户列表
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  
  if ("error" in authResult) {
    return authResult.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""
    const isActive = searchParams.get("isActive")

    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {}
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } }
      ]
    }
    
    if (role) {
      where.role = role
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true"
    }

    // 获取用户列表和总数
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              interviewSchedules: true,
              projects: true,
              personalExperiences: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ])

    // 获取每个用户的 Credits 余额
    const usersWithCredits = await Promise.all(
      users.map(async (user) => {
        const credits = await prisma.userCredits.findUnique({
          where: { userId: user.id },
          select: {
            creditsBalance: true,
            dailyUsed: true,
            monthlyUsed: true
          }
        })

        return {
          ...user,
          credits: credits ? {
            balance: credits.creditsBalance,
            dailyUsed: credits.dailyUsed,
            monthlyUsed: credits.monthlyUsed
          } : null
        }
      })
    )

    // 获取统计信息
    const [totalUsers, activeUsers, adminUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "admin" } })
    ])

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithCredits,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          totalUsers,
          activeUsers,
          adminUsers,
          inactiveUsers: totalUsers - activeUsers
        }
      }
    })
  } catch (error) {
    console.error("获取用户列表失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "获取用户列表失败"
      },
      { status: 500 }
    )
  }
}

// 更新用户信息
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request)
  
  if ("error" in authResult) {
    return authResult.error
  }

  try {
    const body = await request.json()
    const { userId, role, isActive, name } = body

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          message: "缺少用户ID"
        },
        { status: 400 }
      )
    }

    // 不能修改自己的角色或状态
    if (userId === authResult.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "不能修改自己的角色或状态"
        },
        { status: 403 }
      )
    }

    // 构建更新数据
    const updateData: any = {}
    if (role !== undefined) {
      if (!["user", "admin"].includes(role)) {
        return NextResponse.json(
          {
            success: false,
            error: "Bad Request",
            message: "无效的角色"
          },
          { status: 400 }
        )
      }
      updateData.role = role
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive
    }
    if (name !== undefined) {
      updateData.name = name
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: "用户信息更新成功",
      data: updatedUser
    })
  } catch (error) {
    console.error("更新用户信息失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "更新用户信息失败"
      },
      { status: 500 }
    )
  }
}

