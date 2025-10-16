import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

// 注册数据验证schema
const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少需要6个字符"),
  name: z.string().min(1, "请输入姓名"),
})

export async function POST(request: NextRequest) {
  try {
    console.log("注册API被调用")
    
    // 添加CORS支持
    const headers = new Headers()
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    // 检查数据库连接
    console.log("检查数据库连接...")
    try {
      await prisma.$connect()
      console.log("数据库连接成功")
    } catch (dbError) {
      console.error("数据库连接失败:", dbError)
      return NextResponse.json(
        { 
          error: "数据库连接失败", 
          details: "请检查数据库配置",
          debug: process.env.NODE_ENV === 'development' ? dbError : undefined
        },
        { status: 500 }
      )
    }
    
    const body = await request.json()
    console.log("请求体:", { ...body, password: '[HIDDEN]' })
    
    // 验证输入数据
    const validatedData = registerSchema.parse(body)
    const { email, password, name } = validatedData

    // 检查邮箱是否已存在
    console.log("检查邮箱是否已存在:", email)
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log("邮箱已存在:", email)
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      )
    }

    // 加密密码
    console.log("加密密码...")
    const hashedPassword = await bcrypt.hash(password, 12)

    // 创建用户
    console.log("创建用户...")
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    })

    // 为新用户创建积分记录
    console.log("创建用户积分记录...")
    await prisma.userCredits.create({
      data: {
        userId: user.id,
        creditsBalance: 2000, // 新用户给2000积分
        dailyUsed: 0,
        monthlyUsed: 0,
        lastDailyReset: new Date(),
        lastMonthlyReset: new Date()
      }
    })

    console.log("用户创建成功:", user.id)
    return NextResponse.json(
      { 
        message: "注册成功", 
        user 
      },
      { status: 201, headers }
    )

  } catch (error) {
    console.error("注册错误详情:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT_SET'
    })
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入数据格式错误", details: error.issues },
        { status: 400 }
      )
    }

    // 数据库相关错误
    if (error instanceof Error && error.message.includes('connect')) {
      return NextResponse.json(
        { 
          error: "数据库连接失败", 
          details: "请检查数据库配置和网络连接" 
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        error: "注册失败，请稍后重试",
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
