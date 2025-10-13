import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
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
