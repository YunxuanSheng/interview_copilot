import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 如果是demo用户，返回模拟数据
    if (session.user.email === "demo@example.com") {
      const mockData = {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: "演示用户",
          phone: "138****8888",
          location: "北京市",
          summary: "这是一个演示用户的数据",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        educations: [
          {
            id: "1",
            school: "清华大学",
            degree: "本科",
            major: "计算机科学与技术",
            startDate: "2018-09-01T00:00:00.000Z",
            endDate: "2022-06-30T00:00:00.000Z",
            description: "主修计算机科学与技术专业"
          }
        ],
        workExperiences: [
          {
            id: "1",
            company: "腾讯",
            position: "前端开发工程师",
            startDate: "2022-07-01T00:00:00.000Z",
            endDate: null,
            description: "负责前端开发工作",
            achievements: "完成了多个重要项目"
          }
        ],
        skills: [
          {
            id: "1",
            name: "JavaScript",
            level: "advanced",
            category: "technical"
          }
        ],
        projects: [
          {
            id: "1",
            name: "面试准备项目",
            role: "全栈开发",
            description: "面试准备相关项目",
            timeRange: "2024年",
            techStack: "React, Node.js",
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            cards: []
          }
        ],
        interviewSchedules: [],
        personalExperiences: [],
        interviewRecords: [],
        interviewSharings: [],
        jobApplications: [],
        aiUsageStats: [],
        userCredits: {
          creditsBalance: 2000,
          dailyUsed: 0,
          monthlyUsed: 0,
          dailyRemaining: 200,
          monthlyRemaining: 2000,
          dailyLimit: 200,
          monthlyLimit: 2000
        },
        exportDate: new Date().toISOString(),
        exportVersion: "1.0"
      }

      return NextResponse.json({
        success: true,
        data: mockData
      })
    }

    // 获取用户的所有数据
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        educations: true,
        workExperiences: true,
        skills: true,
        projects: {
          include: {
            cards: true
          }
        },
        interviewSchedules: {
          include: {
            interviewRecords: {
              include: {
                questions: true
              }
            }
          }
        },
        personalExperiences: true,
        interviewSharings: true,
        jobApplications: true,
        aiUsageStats: true,
        userCredits: true
      }
    })

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 格式化导出数据
    const exportData = {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        location: userData.location,
        summary: userData.summary,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      },
      educations: userData.educations,
      workExperiences: userData.workExperiences,
      skills: userData.skills,
      projects: userData.projects,
      interviewSchedules: userData.interviewSchedules,
      personalExperiences: userData.personalExperiences,
      interviewRecords: userData.interviewSchedules.flatMap(schedule => schedule.interviewRecords),
      interviewSharings: userData.interviewSharings,
      jobApplications: userData.jobApplications,
      aiUsageStats: userData.aiUsageStats,
      userCredits: userData.userCredits,
      exportDate: new Date().toISOString(),
      exportVersion: "1.0"
    }

    return NextResponse.json({
      success: true,
      data: exportData
    })
  } catch (error) {
    console.error("Data export error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

