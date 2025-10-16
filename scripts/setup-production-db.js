#!/usr/bin/env node

/**
 * 生产环境数据库设置脚本
 * 用于在 Vercel 部署后初始化数据库
 */

const { PrismaClient } = require('@prisma/client')

async function setupProductionDatabase() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔗 连接生产数据库...')
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    console.log('📊 检查数据库状态...')
    const userCount = await prisma.user.count()
    console.log(`📈 当前用户数量: ${userCount}`)
    
    console.log('🎉 生产数据库设置完成')
    
  } catch (error) {
    console.error('❌ 数据库设置失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  setupProductionDatabase()
}

module.exports = { setupProductionDatabase }
