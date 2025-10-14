import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("Testing database connection...")
    
    // 测试数据库连接
    await prisma.$connect()
    console.log("Database connected successfully")
    
    // 测试查询
    const userCount = await prisma.user.count()
    console.log(`Found ${userCount} users in database`)
    
    // 测试表结构
    const users = await prisma.user.findMany({
      take: 1,
      select: {
        id: true,
        email: true,
        name: true,
        password: true, // 检查password字段是否存在
        createdAt: true,
      }
    })
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      userCount,
      hasPasswordField: users.length > 0 ? users[0].password !== undefined : "No users to check",
      sampleUser: users[0] || null
    })
    
  } catch (error) {
    console.error("Database test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}