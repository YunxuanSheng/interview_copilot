import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

/**
 * 获取埋点统计数据
 * GET /api/admin/analytics
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  
  if ("error" in authResult) {
    return authResult.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const eventType = searchParams.get('eventType')
    const eventName = searchParams.get('eventName')

    // 检查 EventLog 表是否存在（使用类型断言，因为可能还没生成类型）
    const eventLogModel = (prisma as any).eventLog
    if (!eventLogModel) {
      return NextResponse.json({
        success: true,
        data: {
          overview: {
            totalEvents: 0,
            uniqueUsers: 0,
            pageViews: 0,
            errors: 0,
          },
          byType: [],
          topEvents: [],
          trend: [],
          featureUse: [],
          buttonClicks: [],
          funnel: [],
          devices: [],
        },
        message: 'EventLog 表尚未创建，请运行: npx prisma migrate dev',
      })
    }

    // 检查表是否存在（如果表不存在，返回空数据）
    try {
      await eventLogModel.findFirst()
    } catch (tableError: any) {
      // 如果表不存在，返回空数据
      if (tableError?.code === 'P2021' || tableError?.message?.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          data: {
            overview: {
              totalEvents: 0,
              uniqueUsers: 0,
              pageViews: 0,
              errors: 0,
            },
            byType: [],
            topEvents: [],
            trend: [],
            featureUse: [],
            buttonClicks: [],
            funnel: [],
            devices: [],
          },
          message: 'EventLog 表尚未创建，请运行: npx prisma migrate dev',
        })
      }
      throw tableError
    }

    // 构建查询条件
    const where: any = {}
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }
    
    if (eventType) {
      where.eventType = eventType
    }
    
    if (eventName) {
      where.eventName = eventName
    }

    // 默认查询最近30天
    const defaultStartDate = startDate 
      ? new Date(startDate) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const defaultEndDate = endDate 
      ? new Date(endDate) 
      : new Date()

    // 获取总事件数
    const totalEvents = await eventLogModel.count({ where }).catch(() => 0)

    // 获取唯一用户数（UV）
    const uniqueUsers = await eventLogModel.findMany({
      where: {
        ...where,
        userId: { not: null },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    }).catch(() => [])

    // 按事件类型分组统计（处理 SQLite 兼容性）
    let eventsByType: Array<{ eventType: string; _count?: { id: number } }> = []
    try {
      eventsByType = await eventLogModel.groupBy({
        by: ['eventType'],
        where,
        _count: {
          id: true,
        },
      })
    } catch (groupByError) {
      // 如果 groupBy 失败，手动统计
      const allEvents = await eventLogModel.findMany({
        where,
        select: { eventType: true },
      })
      const typeMap = new Map<string, number>()
      allEvents.forEach((event: any) => {
        typeMap.set(event.eventType, (typeMap.get(event.eventType) || 0) + 1)
      })
      eventsByType = Array.from(typeMap.entries()).map(([eventType, count]) => ({
        eventType,
        _count: { id: count },
      }))
    }

    // 按事件名称分组统计（Top 10）
    let eventsByName: Array<{ eventName: string; _count?: { id: number } }> = []
    try {
      eventsByName = await eventLogModel.groupBy({
        by: ['eventName'],
        where,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      })
    } catch (groupByError) {
      // 如果 groupBy 失败，手动统计
      const allEvents = await eventLogModel.findMany({
        where,
        select: { eventName: true },
      })
      const nameMap = new Map<string, number>()
      allEvents.forEach((event: any) => {
        nameMap.set(event.eventName, (nameMap.get(event.eventName) || 0) + 1)
      })
      eventsByName = Array.from(nameMap.entries())
        .map(([eventName, count]) => ({ eventName, _count: { id: count } }))
        .sort((a, b) => (b._count?.id || 0) - (a._count?.id || 0))
        .slice(0, 10)
    }

    // 获取最近30天的趋势数据（按天）
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(defaultStartDate)
      date.setDate(date.getDate() + i)
      date.setHours(0, 0, 0, 0)
      return date
    }).filter(date => date <= defaultEndDate)

    const trendData = await Promise.all(
      last30Days.map(async (date) => {
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)
        
        const [count, uniqueUsersCount] = await Promise.all([
          eventLogModel.count({
            where: {
              ...where,
              createdAt: {
                gte: date,
                lt: nextDate,
              },
            },
          }),
          eventLogModel.findMany({
            where: {
              ...where,
              createdAt: {
                gte: date,
                lt: nextDate,
              },
              userId: { not: null },
            },
            select: {
              userId: true,
            },
            distinct: ['userId'],
          }),
        ])

        return {
          date: date.toISOString().split('T')[0],
          count,
          uniqueUsers: uniqueUsersCount.length,
        }
      })
    )

    // 获取页面访问统计（PV）
    const pageViewCount = await eventLogModel.count({
      where: {
        ...where,
        eventType: 'page_view',
      },
    }).catch(() => 0)

    // 获取功能使用 Top 10
    let featureUseStats: Array<{ eventName: string; _count?: { id: number } }> = []
    try {
      featureUseStats = await eventLogModel.groupBy({
        by: ['eventName'],
        where: {
          ...where,
          eventType: 'feature_use',
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      })
    } catch (groupByError) {
      // 手动统计
      const allFeatureEvents = await eventLogModel.findMany({
        where: {
          ...where,
          eventType: 'feature_use',
        },
        select: { eventName: true },
      })
      const featureMap = new Map<string, number>()
      allFeatureEvents.forEach((event: any) => {
        featureMap.set(event.eventName, (featureMap.get(event.eventName) || 0) + 1)
      })
      featureUseStats = Array.from(featureMap.entries())
        .map(([eventName, count]) => ({ eventName, _count: { id: count } }))
        .sort((a, b) => (b._count?.id || 0) - (a._count?.id || 0))
        .slice(0, 10)
    }

    // 获取错误统计
    const errorCount = await eventLogModel.count({
      where: {
        ...where,
        eventType: 'error',
      },
    }).catch(() => 0)

    // 获取按钮点击 Top 10
    let buttonClickStats: Array<{ eventName: string; _count?: { id: number } }> = []
    try {
      buttonClickStats = await eventLogModel.groupBy({
        by: ['eventName'],
        where: {
          ...where,
          eventType: 'button_click',
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      })
    } catch (groupByError) {
      // 手动统计
      const allButtonEvents = await eventLogModel.findMany({
        where: {
          ...where,
          eventType: 'button_click',
        },
        select: { eventName: true },
      })
      const buttonMap = new Map<string, number>()
      allButtonEvents.forEach((event: any) => {
        buttonMap.set(event.eventName, (buttonMap.get(event.eventName) || 0) + 1)
      })
      buttonClickStats = Array.from(buttonMap.entries())
        .map(([eventName, count]) => ({ eventName, _count: { id: count } }))
        .sort((a, b) => (b._count?.id || 0) - (a._count?.id || 0))
        .slice(0, 10)
    }

    // 计算转化漏斗（示例：注册 -> 首次使用 -> 持续使用）
    // 这里可以根据实际业务需求定义转化步骤
    const funnelSteps = [
      { name: '注册', eventName: 'user_register' },
      { name: '首次登录', eventName: 'user_first_login' },
      { name: '创建面试', eventName: 'interview_create' },
      { name: '上传简历', eventName: 'resume_upload' },
    ]

    const funnelData = await Promise.all(
      funnelSteps.map(async (step) => {
        const count = await eventLogModel.count({
          where: {
            ...where,
            eventName: step.eventName,
          },
        }).catch(() => 0)
        return {
          step: step.name,
          eventName: step.eventName,
          count,
        }
      })
    )

    // 获取设备统计（屏幕尺寸分布）
    const deviceStats = await eventLogModel.findMany({
      where: {
        ...where,
        screenWidth: { not: null },
        screenHeight: { not: null },
      },
      select: {
        screenWidth: true,
        screenHeight: true,
        userAgent: true,
      },
      take: 1000, // 采样1000条
    }).catch(() => [])

    // 计算设备类型分布
    const deviceTypes: Record<string, number> = {}
    deviceStats.forEach((device: any) => {
      if (!device.userAgent) return
      
      let deviceType = 'desktop'
      const ua = device.userAgent.toLowerCase()
      
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        deviceType = 'tablet'
      } else if (
        /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
          ua
        )
      ) {
        deviceType = 'mobile'
      }
      
      deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalEvents,
          uniqueUsers: uniqueUsers.length,
          pageViews: pageViewCount,
          errors: errorCount,
        },
        byType: eventsByType.map((item) => ({
          eventType: item.eventType,
          count: item._count?.id || 0,
        })),
        topEvents: eventsByName.map((item) => ({
          eventName: item.eventName,
          count: item._count?.id || 0,
        })),
        trend: trendData,
        featureUse: featureUseStats.map((item) => ({
          eventName: item.eventName,
          count: item._count?.id || 0,
        })),
        buttonClicks: buttonClickStats.map((item) => ({
          eventName: item.eventName,
          count: item._count?.id || 0,
        })),
        funnel: funnelData,
        devices: Object.entries(deviceTypes).map(([type, count]) => ({
          type,
          count,
        })),
      },
    })
  } catch (error) {
    console.error("获取埋点统计数据失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "获取埋点统计数据失败",
      },
      { status: 500 }
    )
  }
}

