import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(_request: NextRequest) {
  try {
    console.log('🌱 开始播种数据...')
    
    // 检查数据库连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 获取所有用户
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    })
    
    console.log(`👥 找到 ${users.length} 个用户`)
    
    // 为每个用户创建积分记录
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
      } catch (error) {
        console.log(`⚠️ 用户 ${user.email} 积分记录可能已存在`)
      }
    }
    
    // 创建测试面经数据
    if (users.length > 0) {
      const testUser = users[0]
      
      // 创建几个测试面经
      const testSharings = [
        {
          company: '字节跳动',
          position: '前端开发工程师',
          department: '技术部',
          round: 1,
          difficulty: 'hard',
          experience: 'positive',
          questions: [
            '请介绍一下你自己',
            '为什么选择我们公司？',
            '你的技术栈是什么？',
            '如何处理团队冲突？',
            '请手写一个防抖函数'
          ],
          tips: '准备充分，保持自信，展示解决问题的能力。技术问题要思路清晰，代码要规范。',
          tags: '前端,React,JavaScript,团队协作,算法'
        },
        {
          company: '腾讯',
          position: '全栈开发工程师',
          department: '微信事业群',
          round: 2,
          difficulty: 'medium',
          experience: 'neutral',
          questions: [
            '请介绍你最有挑战性的项目',
            '如何优化网站性能？',
            '微服务架构的优缺点？',
            '如何处理高并发？'
          ],
          tips: '重点展示项目经验，准备具体的技术方案和优化思路。',
          tags: '全栈,Node.js,性能优化,微服务,高并发'
        },
        {
          company: '阿里巴巴',
          position: 'Java开发工程师',
          department: '淘宝技术部',
          round: 3,
          difficulty: 'hard',
          experience: 'positive',
          questions: [
            'Spring Boot的核心原理？',
            'JVM内存模型？',
            '分布式事务如何解决？',
            'Redis的持久化机制？'
          ],
          tips: '深入理解Java生态，准备底层原理和分布式系统相关知识。',
          tags: 'Java,Spring Boot,JVM,分布式,Redis'
        }
      ]
      
      for (const sharing of testSharings) {
        try {
          await prisma.interviewSharing.create({
            data: {
              userId: testUser.id,
              company: sharing.company,
              position: sharing.position,
              department: sharing.department,
              round: sharing.round,
              difficulty: sharing.difficulty,
              experience: sharing.experience,
              questions: JSON.stringify(sharing.questions),
              tips: sharing.tips,
              tags: sharing.tags,
              isPublic: true
            }
          })
          console.log(`✅ 创建了 ${sharing.company} 的面经`)
        } catch (error) {
          console.log(`⚠️ ${sharing.company} 面经可能已存在`)
        }
      }
    }
    
    // 检查最终结果
    const finalStats = {
      users: await prisma.user.count(),
      userCredits: await prisma.userCredits.count(),
      interviewSharings: await prisma.interviewSharing.count()
    }
    
    console.log('📊 最终统计:', finalStats)
    console.log('🎉 数据播种完成')
    
    return NextResponse.json({
      success: true,
      message: '数据播种成功',
      data: finalStats
    })
    
  } catch (error) {
    console.error('❌ 数据播种失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '数据播种失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
