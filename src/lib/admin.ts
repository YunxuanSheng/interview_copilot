import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { Session } from "next-auth"

export type UserRole = "user" | "admin"

/**
 * 检查用户是否为管理员
 * @param userId 用户ID
 * @returns 是否为管理员
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true }
    })
    
    return user?.role === "admin" && user?.isActive === true
  } catch (error) {
    console.error("检查管理员权限失败:", error)
    return false
  }
}

/**
 * 获取用户角色
 * @param userId 用户ID
 * @returns 用户角色
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true }
    })
    
    if (!user || !user.isActive) {
      return null
    }
    
    return (user.role as UserRole) || "user"
  } catch (error) {
    console.error("获取用户角色失败:", error)
    return null
  }
}

/**
 * 要求管理员权限的中间件
 * 如果用户不是管理员，返回 403 错误响应
 * @param request NextRequest 对象
 * @returns session 和 user 对象，或错误响应
 */
export async function requireAdmin(request: NextRequest): Promise<
  | { session: Session; user: { id: string; email: string; role: string; isActive: boolean } }
  | { error: NextResponse }
> {
  const session = await getServerSession(authOptions) as Session | null
  
  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { success: false, error: "Unauthorized", message: "请先登录" },
        { status: 401 }
      )
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true, isActive: true }
    })

    if (!user || user.role !== "admin" || !user.isActive) {
      return {
        error: NextResponse.json(
          { success: false, error: "Forbidden", message: "权限不足，需要管理员权限" },
          { status: 403 }
        )
      }
    }

    return { session, user }
  } catch (error) {
    console.error("权限检查失败:", error)
    return {
      error: NextResponse.json(
        { success: false, error: "Internal server error", message: "权限检查失败" },
        { status: 500 }
      )
    }
  }
}

/**
 * 检查用户是否具有指定角色
 * @param request NextRequest 对象
 * @param allowedRoles 允许的角色列表
 * @returns session 和 user 对象，或错误响应
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<
  | { session: Session; user: { id: string; email: string; role: string; isActive: boolean } }
  | { error: NextResponse }
> {
  const session = await getServerSession(authOptions) as Session | null
  
  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { success: false, error: "Unauthorized", message: "请先登录" },
        { status: 401 }
      )
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true, isActive: true }
    })

    if (!user || !allowedRoles.includes(user.role as UserRole) || !user.isActive) {
      return {
        error: NextResponse.json(
          { success: false, error: "Forbidden", message: "权限不足" },
          { status: 403 }
        )
      }
    }

    return { session, user }
  } catch (error) {
    console.error("权限检查失败:", error)
    return {
      error: NextResponse.json(
        { success: false, error: "Internal server error", message: "权限检查失败" },
        { status: 500 }
      )
    }
  }
}

