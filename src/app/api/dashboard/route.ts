import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 如果是demo用户，返回模拟数据
    if (session.user.email === "demo@example.com") {
      const mockStats = {
        totalSchedules: 6,
        completedInterviews: 1,
        totalExperiences: 6,
        upcomingInterviews: 3,
        totalProjects: 4
      }

      const mockUpcomingInterviews = [
        {
          id: "1",
          company: "腾讯",
          position: "前端开发工程师",
          interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          round: 1
        },
        {
          id: "2",
          company: "字节跳动",
          position: "全栈开发工程师",
          interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          round: 2
        },
        {
          id: "4",
          company: "美团",
          position: "后端开发工程师",
          interviewDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          round: 1
        }
      ]

      const mockAllInterviews = [
        ...mockUpcomingInterviews,
        {
          id: "3",
          company: "阿里巴巴",
          position: "Java开发工程师",
          interviewDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          round: 1
        },
        {
          id: "5",
          company: "百度",
          position: "Python开发工程师",
          interviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          round: 2
        }
      ]

      const mockRecentExperiences = [
        {
          id: "exp1",
          title: "实现一个LRU缓存",
          company: "字节跳动",
          description: "设计并实现一个LRU（最近最少使用）缓存机制。要求支持get和put操作，时间复杂度为O(1)。",
          solution: "使用HashMap + 双向链表。HashMap存储key到节点的映射，双向链表维护访问顺序。",
          difficulty: "困难",
          tags: ["算法", "数据结构", "缓存"],
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "exp2",
          title: "React性能优化方案",
          company: "腾讯",
          description: "在React项目中，如何优化组件渲染性能？请列举具体的优化策略和实现方法。",
          solution: "使用React.memo、useMemo、useCallback，避免不必要的重渲染，使用虚拟滚动等。",
          difficulty: "中等",
          tags: ["React", "性能优化", "前端"],
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "exp3",
          title: "数据库事务隔离级别",
          company: "美团",
          description: "解释数据库事务的四种隔离级别，以及它们分别解决了什么问题？",
          solution: "读未提交、读已提交、可重复读、串行化。分别解决脏读、不可重复读、幻读问题。",
          difficulty: "简单",
          tags: ["数据库", "事务", "MySQL"],
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "exp4",
          title: "微服务架构设计",
          company: "阿里巴巴",
          description: "在设计微服务架构时，需要考虑哪些关键因素？如何保证服务间的通信和数据一致性？",
          solution: "服务拆分、服务发现、负载均衡、熔断降级、分布式事务、API网关等。",
          difficulty: "困难",
          tags: ["微服务", "架构设计", "分布式"],
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      return NextResponse.json({
        stats: mockStats,
        upcomingInterviews: mockUpcomingInterviews,
        allInterviews: mockAllInterviews,
        recentExperiences: mockRecentExperiences
      })
    }

    const userId = session.user.id

    // 获取统计数据
    const [
      totalSchedules,
      completedInterviews,
      totalExperiences,
      totalProjects,
      upcomingInterviews
    ] = await Promise.all([
      prisma.interviewSchedule.count({
        where: { userId }
      }),
      prisma.interviewSchedule.count({
        where: { 
          userId,
          status: "completed"
        }
      }),
      prisma.personalExperience.count({
        where: { userId }
      }),
      prisma.project.count({
        where: { userId }
      }),
      prisma.interviewSchedule.count({
        where: {
          userId,
          status: "scheduled",
          interviewDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天内
          }
        }
      })
    ])

    // 获取即将到来的面试详情
    const upcomingInterviewsList = await prisma.interviewSchedule.findMany({
      where: {
        userId,
        status: "scheduled",
        interviewDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        interviewDate: "asc"
      },
      take: 5,
      select: {
        id: true,
        company: true,
        position: true,
        interviewDate: true,
        round: true
      }
    })

    // 获取所有面试数据（用于日历标记）
    const allInterviewsList = await prisma.interviewSchedule.findMany({
      where: {
        userId
      },
      orderBy: {
        interviewDate: "asc"
      },
      select: {
        id: true,
        company: true,
        position: true,
        interviewDate: true,
        round: true
      }
    })

    // 获取最近的面经数据
    const recentExperiencesList = await prisma.personalExperience.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 5,
      select: {
        id: true,
        title: true,
        company: true,
        description: true,
        solution: true,
        difficulty: true,
        tags: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      stats: {
        totalSchedules,
        completedInterviews,
        totalExperiences,
        totalProjects,
        upcomingInterviews
      },
      upcomingInterviews: upcomingInterviewsList,
      allInterviews: allInterviewsList,
      recentExperiences: recentExperiencesList
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
