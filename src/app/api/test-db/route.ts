import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from '@prisma/client'

export async function GET(_request: NextRequest) {
  try {
    console.log('=== 数据库连接测试 ===')
    console.log('DATABASE_URL 存在:', !!process.env.DATABASE_URL)
    console.log('DATABASE_URL 前缀:', process.env.DATABASE_URL?.substring(0, 20))
    
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    })
    
    console.log('正在尝试连接数据库...')
    
    // 测试基本连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 测试简单查询
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ 查询测试成功:', result)
    
    // 检查用户表是否存在
    let userCount = 0
    try {
      userCount = await prisma.user.count()
      console.log('✅ 用户表存在，用户数量:', userCount)
    } catch (error) {
      console.log('❌ 用户表不存在或有问题:', error)
    }
    
    await prisma.$disconnect()
    console.log('✅ 数据库断开连接成功')
    
    return NextResponse.json({
      status: "success",
      message: "数据库连接成功",
      details: {
        connected: true,
        userCount,
        databaseUrl: process.env.DATABASE_URL?.substring(0, 30) + "...",
      }
    })
    
  } catch (error) {
    console.error('❌ 数据库连接失败:')
    console.error('错误类型:', error?.constructor?.name)
    console.error('错误消息:', error?.message)
    console.error('错误代码:', error?.code)
    console.error('完整错误:', error)
    
    return NextResponse.json({
      status: "error",
      message: "数据库连接失败",
      error: {
        type: error?.constructor?.name,
        message: error?.message,
        code: error?.code,
      }
    }, { status: 500 })
  }
}
