#!/usr/bin/env node
// 数据库部署脚本
const { execSync } = require('child_process')

console.log('🚀 开始部署数据库迁移...')

try {
  // 1. 生成Prisma客户端
  console.log('📦 生成Prisma客户端...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  
  // 2. 执行数据库迁移
  console.log('🔄 执行数据库迁移...')
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })
  
  // 3. 验证迁移结果
  console.log('✅ 数据库迁移完成')
  console.log('📋 迁移文件已应用到生产数据库')
  
} catch (error) {
  console.error('❌ 部署失败:', error.message)
  process.exit(1)
}
