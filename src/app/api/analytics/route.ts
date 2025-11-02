import { NextRequest, NextResponse } from 'next/server'
import { trackEvents, getClientIp, type EventLogData } from '@/lib/analytics'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

/**
 * 接收客户端埋点数据
 * POST /api/analytics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { events } = body

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'events 必须是一个数组',
        },
        { status: 400 }
      )
    }

    // 获取用户信息（如果已登录）
    const session = await getServerSession(authOptions)
    const userId = session?.user && 'id' in session.user ? session.user.id : undefined

    // 获取IP地址
    const ipAddress = getClientIp(request)
    
    // 获取 User-Agent
    const userAgent = request.headers.get('user-agent') || undefined

    // 获取 Referer
    const referer = request.headers.get('referer') || undefined

    // 转换客户端事件数据为服务端格式
    const eventData: EventLogData[] = events.map((event: any) => {
      // 从 properties 中提取设备信息（如果有）
      const properties = event.properties || {}
      const screenWidth = properties.screenWidth || undefined
      const screenHeight = properties.screenHeight || undefined

      return {
        userId: userId || undefined,
        eventType: event.eventType,
        eventName: event.eventName,
        properties: event.properties,
        userAgent: userAgent,
        ipAddress: ipAddress || undefined,
        pageUrl: event.pageUrl || undefined,
        referrer: event.referrer || referer || undefined,
        screenWidth: screenWidth,
        screenHeight: screenHeight,
      }
    })

    // 批量记录事件
    await trackEvents(eventData)

    return NextResponse.json({
      success: true,
      message: '事件记录成功',
      count: events.length,
    })
  } catch (error) {
    console.error('处理埋点数据失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : '处理埋点数据失败',
      },
      { status: 500 }
    )
  }
}

/**
 * 查询埋点数据（管理员）
 * GET /api/analytics
 */
export async function GET(request: NextRequest) {
  try {
    // 检查管理员权限
    const session = await getServerSession(authOptions)
    if (!session?.user || !('role' in session.user) || session.user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: '需要管理员权限',
        },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const eventType = searchParams.get('eventType')
    const eventName = searchParams.get('eventName')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    // 构建查询条件
    const where: any = {}
    
    if (eventType) {
      where.eventType = eventType
    }
    
    // 注意：SQLite 不支持 contains，我们需要在应用层处理搜索
    // 这里先使用简单的相等匹配，或者使用 startsWith
    // 如果需要模糊搜索，可以在获取结果后过滤
    
    if (userId) {
      where.userId = userId
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const { prisma } = await import('@/lib/prisma')
    
    // 注意：搜索功能在应用层处理，因为 SQLite 不支持 contains
    
    // 先获取所有匹配基础条件的事件
    let allEvents = await prisma.eventLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    // 在应用层进行模糊搜索（SQLite 不支持 contains）
    if (search) {
      const searchLower = search.toLowerCase()
      allEvents = allEvents.filter((event) => {
        return (
          event.eventName.toLowerCase().includes(searchLower) ||
          (event.pageUrl && event.pageUrl.toLowerCase().includes(searchLower)) ||
          (event.user?.email && event.user.email.toLowerCase().includes(searchLower)) ||
          (event.user?.name && event.user.name.toLowerCase().includes(searchLower))
        )
      })
    }

    if (eventName) {
      const eventNameLower = eventName.toLowerCase()
      allEvents = allEvents.filter((event) =>
        event.eventName.toLowerCase().includes(eventNameLower)
      )
    }

    // 计算总数（应用过滤后）
    const total = allEvents.length

    // 分页
    const events = allEvents.slice(offset, offset + limit)

    // 解析 JSON 属性
    const formattedEvents = events.map((event) => ({
      ...event,
      properties: event.properties ? JSON.parse(event.properties) : null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        events: formattedEvents,
        total,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('查询埋点数据失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : '查询埋点数据失败',
      },
      { status: 500 }
    )
  }
}

