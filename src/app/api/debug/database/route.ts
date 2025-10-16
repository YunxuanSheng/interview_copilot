import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 开始数据库调试...')
    
    // 检查数据库连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 检查表是否存在
    const tables = {
      users: await prisma.user.count(),
      userCredits: await prisma.userCredits.count(),
      interviewSharings: await prisma.interviewSharing.count(),
      interviewRecords: await prisma.interviewRecord.count(),
      interviewQuestions: await prisma.interviewQuestion.count(),
      interviewLikes: await prisma.interviewLike.count()
    }
    
    console.log('📊 表记录数:', tables)
    
    // 检查面经表结构
    let sharingsSample: any[] = []
    try {
      sharingsSample = await prisma.interviewSharing.findMany({
        take: 3,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          _count: {
            select: {
              likes: true
            }
          }
        }
      })
      console.log('✅ 面经查询成功')
    } catch (error) {
      console.error('❌ 面经查询失败:', error)
    }
    
    // 检查用户积分
    let creditsSample: any[] = []
    try {
      creditsSample = await prisma.userCredits.findMany({
        take: 3
      })
      console.log('✅ 积分查询成功')
    } catch (error) {
      console.error('❌ 积分查询失败:', error)
    }
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        tables,
        sharingsSample,
        creditsSample
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT_SET'
      }
    })
    
  } catch (error) {
    console.error('❌ 数据库调试失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '数据库调试失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
