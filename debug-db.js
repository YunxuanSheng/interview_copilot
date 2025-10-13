// 数据库连接调试脚本
const { PrismaClient } = require('@prisma/client')

async function debugDatabase() {
  console.log('=== 数据库连接调试 ===')
  
  // 检查环境变量
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置')
  console.log('DATABASE_URL 长度:', process.env.DATABASE_URL?.length || 0)
  console.log('DATABASE_URL 前缀:', process.env.DATABASE_URL?.substring(0, 20) || 'N/A')
  
  try {
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
    try {
      const userCount = await prisma.user.count()
      console.log('✅ 用户表存在，用户数量:', userCount)
    } catch (error) {
      console.log('❌ 用户表不存在或有问题:', error.message)
    }
    
    await prisma.$disconnect()
    console.log('✅ 数据库断开连接成功')
    
  } catch (error) {
    console.error('❌ 数据库连接失败:')
    console.error('错误类型:', error.constructor.name)
    console.error('错误消息:', error.message)
    console.error('错误代码:', error.code)
    console.error('完整错误:', error)
  }
}

debugDatabase().catch(console.error)
