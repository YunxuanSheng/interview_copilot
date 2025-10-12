import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 如果是demo用户，返回模拟数据
    if (session.user.email === "demo@example.com") {
      const mockStats = {
        totalSchedules: 6,
        completedInterviews: 1,
        totalExperiences: 6,
        upcomingInterviews: 3
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

      return NextResponse.json({
        stats: mockStats,
        upcomingInterviews: mockUpcomingInterviews
      })
    }

    const userId = session.user.id

    // 获取统计数据
    const [
      totalSchedules,
      completedInterviews,
      totalExperiences,
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

    return NextResponse.json({
      stats: {
        totalSchedules,
        completedInterviews,
        totalExperiences,
        upcomingInterviews
      },
      upcomingInterviews: upcomingInterviewsList
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
