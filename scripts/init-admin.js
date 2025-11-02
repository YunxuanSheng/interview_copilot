#!/usr/bin/env node

/**
 * 初始化管理员账号脚本
 * 将指定邮箱设置为管理员
 */

const { PrismaClient } = require('@prisma/client')

const ADMIN_EMAIL = '13516823187@163.com'

async function initAdmin() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔗 连接数据库...')
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 查找或创建管理员用户
    console.log(`🔍 查找邮箱: ${ADMIN_EMAIL}`)
    let user = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL }
    })
    
    if (user) {
      console.log('👤 用户已存在，更新为管理员...')
      user = await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: {
          role: 'admin',
          isActive: true
        }
      })
      console.log(`✅ 用户 ${user.email} 已设置为管理员`)
    } else {
      console.log('➕ 用户不存在，创建管理员账号...')
      user = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          name: '管理员',
          role: 'admin',
          isActive: true
        }
      })
      console.log(`✅ 已创建管理员账号: ${user.email}`)
    }
    
    // 确保用户有 Credits
    const userCredits = await prisma.userCredits.findUnique({
      where: { userId: user.id }
    })
    
    if (!userCredits) {
      console.log('💰 创建用户 Credits 记录...')
      await prisma.userCredits.create({
        data: {
          userId: user.id,
          creditsBalance: 10000, // 管理员给更多初始 Credits
          dailyUsed: 0,
          monthlyUsed: 0
        }
      })
      console.log('✅ Credits 记录已创建')
    }
    
    console.log('🎉 管理员初始化完成')
    console.log(`📧 管理员邮箱: ${user.email}`)
    console.log(`🆔 用户ID: ${user.id}`)
    console.log(`👑 角色: ${user.role}`)
    
  } catch (error) {
    console.error('❌ 初始化失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  initAdmin()
}

module.exports = { initAdmin }

