import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 在开发环境中，如果 Prisma Client 已经存在，先断开连接并重新创建
// 这样可以确保使用最新生成的 Prisma Client
if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
  try {
    globalForPrisma.prisma.$disconnect().catch(() => {})
  } catch {
    // 忽略断开连接错误
  }
  globalForPrisma.prisma = undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 数据库连接健康检查
export async function checkDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log('Database connection successful')
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}
