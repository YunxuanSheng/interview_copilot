import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(_request: NextRequest) {
  try {
    console.log('🚀 开始初始化数据库...')
    
    // 检查数据库连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 创建一些测试数据
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: '测试用户',
        password: 'hashed_password_here'
      }
    })
    
    // 为用户创建积分记录
    await prisma.userCredits.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId: testUser.id,
        creditsBalance: 2000,
        dailyUsed: 0,
        monthlyUsed: 0,
        lastDailyReset: new Date(),
        lastMonthlyReset: new Date()
      }
    })
    
    // 创建测试面经
    await prisma.interviewSharing.create({
      data: {
        userId: testUser.id,
        company: '测试公司',
        position: '前端开发工程师',
        department: '技术部',
        round: 1,
        difficulty: 'medium',
        experience: 'positive',
        questions: JSON.stringify([
          '请介绍一下你自己',
          '为什么选择我们公司？',
          '你的技术栈是什么？'
        ]),
        tips: '准备充分，保持自信',
        tags: '前端,React,JavaScript',
        isPublic: true
      }
    })
    
    console.log('🎉 数据库初始化完成')
    
    return NextResponse.json({
      success: true,
      message: '数据库初始化成功',
      data: {
        user: testUser,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '数据库初始化失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

