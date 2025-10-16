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
      const mockProjects = [
        {
          id: "1",
          userId: session.user.id,
          name: "电商平台重构项目",
          role: "前端开发",
          description: "负责公司核心电商平台的前端重构，从jQuery迁移到React，提升用户体验和开发效率。项目涉及商品展示、购物车、订单管理等核心模块，用户量达到100万+。",
          timeRange: "2023.03 - 2023.08",
          techStack: "React, TypeScript, Redux, Ant Design, Webpack",
          status: "active",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          cards: [
            { id: "1", category: "项目背景", status: "completed", priority: 5 },
            { id: "2", category: "职责拆解", status: "answered", priority: 4 },
            { id: "3", category: "难点挑战", status: "completed", priority: 5 },
            { id: "4", category: "技术实现", status: "answered", priority: 4 },
            { id: "5", category: "协作沟通", status: "draft", priority: 3 },
            { id: "6", category: "反思与优化", status: "draft", priority: 2 }
          ]
        },
        {
          id: "2",
          userId: session.user.id,
          name: "微服务架构升级",
          role: "后端开发",
          description: "主导公司核心业务系统的微服务架构升级，将单体应用拆分为多个微服务，提升系统可扩展性和维护性。涉及用户服务、订单服务、支付服务等8个核心服务。",
          timeRange: "2022.09 - 2023.02",
          techStack: "Spring Boot, Spring Cloud, Docker, Kubernetes, Redis, MySQL",
          status: "active",
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          cards: [
            { id: "7", category: "项目背景", status: "completed", priority: 5 },
            { id: "8", category: "职责拆解", status: "completed", priority: 5 },
            { id: "9", category: "难点挑战", status: "answered", priority: 4 },
            { id: "10", category: "技术实现", status: "completed", priority: 5 },
            { id: "11", category: "协作沟通", status: "answered", priority: 3 },
            { id: "12", category: "反思与优化", status: "draft", priority: 2 }
          ]
        },
        {
          id: "3",
          userId: session.user.id,
          name: "AI推荐系统优化",
          role: "算法工程师",
          description: "优化公司内容推荐算法，通过引入深度学习模型和实时特征工程，将推荐准确率从75%提升到89%，用户点击率提升35%。项目涉及特征工程、模型训练、A/B测试等全流程。",
          timeRange: "2023.06 - 2023.11",
          techStack: "Python, TensorFlow, Spark, Kafka, Redis, PostgreSQL",
          status: "active",
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          cards: [
            { id: "13", category: "项目背景", status: "answered", priority: 4 },
            { id: "14", category: "职责拆解", status: "draft", priority: 3 },
            { id: "15", category: "难点挑战", status: "draft", priority: 3 },
            { id: "16", category: "技术实现", status: "draft", priority: 3 },
            { id: "17", category: "协作沟通", status: "draft", priority: 2 },
            { id: "18", category: "反思与优化", status: "draft", priority: 2 }
          ]
        }
      ]

      return NextResponse.json({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        phone: "138****8888",
        location: "北京市朝阳区",
        summary: "有3年全栈开发经验，熟悉React、Node.js、Python等技术栈，有丰富的项目经验和团队协作能力。",
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        educations: [
          {
            id: "1",
            school: "清华大学",
            degree: "本科",
            major: "计算机科学与技术",
            startDate: "2018-09-01",
            endDate: "2022-06-30",
            description: "主修计算机科学与技术，GPA 3.8/4.0"
          }
        ],
        workExperiences: [
          {
            id: "1",
            company: "腾讯",
            position: "前端开发工程师",
            startDate: "2022-07-01",
            endDate: "2023-12-31",
            description: "负责公司核心产品的前端开发，使用React和TypeScript开发用户界面。",
            achievements: "主导了3个重要项目的开发，提升了用户体验和开发效率。"
          }
        ],
        skills: [
          { id: "1", name: "React", level: "advanced", category: "technical" },
          { id: "2", name: "TypeScript", level: "advanced", category: "technical" },
          { id: "3", name: "Node.js", level: "intermediate", category: "technical" },
          { id: "4", name: "Python", level: "intermediate", category: "technical" },
          { id: "5", name: "英语", level: "advanced", category: "language" }
        ],
        projects: mockProjects
      })
    }

    const _user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        educations: true,
        workExperiences: {
          orderBy: {
            startDate: "desc"
          }
        },
        skills: true,
        projects: {
          include: {
            cards: true
          },
          orderBy: {
            updatedAt: "desc"
          }
        }
      }
    })

    if (!_user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(_user)
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  let body: any = null
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      location, 
      summary, 
      educations, 
      workExperiences, 
      skills 
    } = body

    // 使用事务更新用户信息和相关数据
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 更新用户基本信息
      const _user = await tx.user.update({
        where: { id: session.user.id },
        data: {
          name,
          email,
          phone,
          location,
          summary
        }
      })

      // 删除现有数据
      await tx.education.deleteMany({ where: { userId: session.user.id } })
      await tx.workExperience.deleteMany({ where: { userId: session.user.id } })
      await tx.skill.deleteMany({ where: { userId: session.user.id } })

      // 创建新的教育经历
      if (educations && educations.length > 0) {
        await tx.education.createMany({
          data: educations.map((edu: {
            school: string
            degree: string
            major?: string
            startDate: string
            endDate?: string
            description?: string
          }) => {
            // 处理日期格式，支持 YYYY-MM 格式
            const parseDate = (dateStr: string) => {
              if (dateStr.includes('-') && dateStr.length === 7) {
                // YYYY-MM 格式，添加 -01 使其成为有效的日期
                return new Date(dateStr + '-01')
              }
              return new Date(dateStr)
            }
            
            return {
              userId: session.user.id,
              school: edu.school,
              degree: edu.degree,
              major: edu.major,
              startDate: parseDate(edu.startDate),
              endDate: edu.endDate ? parseDate(edu.endDate) : null,
              description: edu.description
            }
          })
        })
      }

      // 创建新的工作经历
      if (workExperiences && workExperiences.length > 0) {
        await tx.workExperience.createMany({
          data: workExperiences.map((work: {
            company: string
            position: string
            startDate: string
            endDate?: string
            description?: string
            achievements?: string
          }) => {
            // 处理日期格式，支持 YYYY-MM 格式
            const parseDate = (dateStr: string) => {
              if (dateStr.includes('-') && dateStr.length === 7) {
                // YYYY-MM 格式，添加 -01 使其成为有效的日期
                return new Date(dateStr + '-01')
              }
              return new Date(dateStr)
            }
            
            return {
              userId: session.user.id,
              company: work.company,
              position: work.position,
              startDate: parseDate(work.startDate),
              endDate: work.endDate ? parseDate(work.endDate) : null,
              description: work.description,
              achievements: work.achievements
            }
          })
        })
      }

      // 创建新的技能
      if (skills && skills.length > 0) {
        await tx.skill.createMany({
          data: skills.map((skill: {
            name: string
            level: string
            category: string
          }) => ({
            userId: session.user.id,
            name: skill.name,
            level: skill.level,
            category: skill.category
          }))
        })
      }

      // 返回完整的用户信息
      return await tx.user.findUnique({
        where: { id: session.user.id },
        include: {
          educations: true,
          workExperiences: {
            orderBy: {
              startDate: "desc"
            }
          },
          skills: true,
          projects: {
            include: {
              cards: true
            },
            orderBy: {
              updatedAt: "desc"
            }
          }
        }
      })
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Update profile error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      body: body
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
