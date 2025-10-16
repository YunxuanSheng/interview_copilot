import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(_request: NextRequest) {
  try {
    console.log('🚀 开始数据库迁移...')
    
    // 检查数据库连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 创建用户积分记录表（如果不存在）
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "user_credits" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL UNIQUE,
          "creditsBalance" INTEGER NOT NULL DEFAULT 100,
          "dailyUsed" INTEGER NOT NULL DEFAULT 0,
          "monthlyUsed" INTEGER NOT NULL DEFAULT 0,
          "lastDailyReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "lastMonthlyReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `
      console.log('✅ 用户积分表创建成功')
    } catch (error) {
      console.log('⚠️ 用户积分表可能已存在:', error)
    }
    
    // 创建面经分享表（如果不存在）
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "interview_sharings" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "interviewRecordId" TEXT,
          "company" TEXT NOT NULL,
          "position" TEXT NOT NULL,
          "department" TEXT,
          "interviewDate" TIMESTAMP(3),
          "round" INTEGER NOT NULL DEFAULT 1,
          "difficulty" TEXT,
          "experience" TEXT,
          "questions" TEXT NOT NULL,
          "answers" TEXT,
          "tips" TEXT,
          "tags" TEXT,
          "isPublic" BOOLEAN NOT NULL DEFAULT true,
          "viewCount" INTEGER NOT NULL DEFAULT 0,
          "likeCount" INTEGER NOT NULL DEFAULT 0,
          "selectedQuestions" TEXT,
          "enableAnswerSharing" BOOLEAN NOT NULL DEFAULT false,
          "enablePersonalInfo" BOOLEAN NOT NULL DEFAULT false,
          "maskedContent" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `
      console.log('✅ 面经分享表创建成功')
    } catch (error) {
      console.log('⚠️ 面经分享表可能已存在:', error)
    }
    
    // 创建面经点赞表（如果不存在）
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "interview_likes" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "interviewSharingId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE("userId", "interviewSharingId")
        );
      `
      console.log('✅ 面经点赞表创建成功')
    } catch (error) {
      console.log('⚠️ 面经点赞表可能已存在:', error)
    }
    
    // 为现有用户创建积分记录
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    })
    
    console.log(`👥 找到 ${users.length} 个用户`)
    
    for (const user of users) {
      try {
        await prisma.userCredits.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            creditsBalance: 2000, // 给2000积分
            dailyUsed: 0,
            monthlyUsed: 0,
            lastDailyReset: new Date(),
            lastMonthlyReset: new Date()
          }
        })
        console.log(`✅ 为用户 ${user.email} 创建了积分记录`)
      } catch {
        console.log(`⚠️ 用户 ${user.email} 积分记录可能已存在`)
      }
    }
    
    // 创建一些测试面经数据
    try {
      const testUser = users[0]
      if (testUser) {
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
              '你的技术栈是什么？',
              '如何处理团队冲突？'
            ]),
            tips: '准备充分，保持自信，展示解决问题的能力',
            tags: '前端,React,JavaScript,团队协作',
            isPublic: true
          }
        })
        console.log('✅ 创建了测试面经数据')
      }
    } catch (error) {
      console.log('⚠️ 测试面经数据可能已存在:', error)
    }
    
    console.log('🎉 数据库迁移完成')
    
    return NextResponse.json({
      success: true,
      message: '数据库迁移成功',
      data: {
        usersCount: users.length,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '数据库迁移失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
