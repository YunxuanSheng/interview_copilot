#!/usr/bin/env node

/**
 * 修复用户积分记录脚本
 * 为没有积分记录的用户创建初始积分
 */

const { PrismaClient } = require('@prisma/client')

async function fixUserCredits() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 查找没有积分记录的用户...')
    
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
      console.log('✅ 所有用户都有积分记录')
      return
    }
    
    // 为没有积分记录的用户创建积分
    console.log('💰 为用户创建积分记录...')
    
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
      
      console.log(`✅ 为用户 ${user.email} 创建了积分记录`)
    }
    
    console.log('🎉 积分记录修复完成')
    
  } catch (error) {
    console.error('❌ 修复积分记录失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixUserCredits()
}

module.exports = { fixUserCredits }
