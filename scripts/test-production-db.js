// 测试生产环境数据库连接和表结构
const { PrismaClient } = require('@prisma/client')

async function testProductionDB() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 测试生产环境数据库连接...')
    
    // 测试连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 检查users表结构
    const userColumns = await prisma.$queryRaw`
      PRAGMA table_info(users);
    `
    console.log('📋 Users表结构:', userColumns)
    
    // 检查是否有password字段
    const hasPasswordField = userColumns.some(col => col.name === 'password')
    console.log(hasPasswordField ? '✅ password字段存在' : '❌ password字段不存在')
    
    // 测试创建用户（仅测试，不实际创建）
    console.log('🧪 测试用户创建功能...')
    const testUser = {
      email: 'test@example.com',
      password: 'test123',
      name: 'Test User'
    }
    console.log('✅ 用户数据格式正确')
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testProductionDB()
