import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(_request: NextRequest) {
  try {
    console.log('🔍 开始修复用户积分记录...')
    
    // 查找所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })
    
    console.log(`📊 找到 ${users.length} 个用户`)
    
    // 查找已有积分记录的用户
    const usersWithCredits = await prisma.userCredits.findMany({
      select: {
        userId: true
      }
    })
    
    const userIdsWithCredits = new Set(usersWithCredits.map(uc => uc.userId))
    const usersWithoutCredits = users.filter(user => !userIdsWithCredits.has(user.id))
    
    console.log(`⚠️  发现 ${usersWithoutCredits.length} 个用户没有积分记录`)
    
    if (usersWithoutCredits.length === 0) {
      return NextResponse.json({
        success: true,
        message: '所有用户都有积分记录',
        fixed: 0
      })
    }
    
    // 为没有积分记录的用户创建积分
    console.log('💰 为用户创建积分记录...')
    
    const fixedUsers = []
    for (const user of usersWithoutCredits) {
      await prisma.userCredits.create({
        data: {
          userId: user.id,
          creditsBalance: 2000, // 给2000积分
          dailyUsed: 0,
          monthlyUsed: 0,
          lastDailyReset: new Date(),
          lastMonthlyReset: new Date()
        }
      })
      
      fixedUsers.push({
        id: user.id,
        email: user.email,
        name: user.name
      })
      
      console.log(`✅ 为用户 ${user.email} 创建了积分记录`)
    }
    
    return NextResponse.json({
      success: true,
      message: `成功为 ${fixedUsers.length} 个用户创建了积分记录`,
      fixed: fixedUsers.length,
      users: fixedUsers
    })
    
  } catch (error) {
    console.error('❌ 修复积分记录失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '修复积分记录失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
