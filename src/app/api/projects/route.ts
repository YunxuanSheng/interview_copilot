import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

// 获取所有项目
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "active"

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
          ],
          _count: {
            cards: 6,
            documents: 2
          }
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
          ],
          _count: {
            cards: 6,
            documents: 3
          }
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
          ],
          _count: {
            cards: 6,
            documents: 1
          }
        },
        {
          id: "4",
          userId: session.user.id,
          name: "移动端性能优化",
          role: "前端开发",
          description: "负责公司移动端H5页面性能优化，通过代码分割、懒加载、缓存策略等手段，将首屏加载时间从3.2s优化到1.1s，页面交互响应时间提升60%。",
          timeRange: "2023.01 - 2023.04",
          techStack: "Vue.js, Webpack, Service Worker, CDN, 性能监控",
          status: "archived",
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          cards: [
            { id: "19", category: "项目背景", status: "completed", priority: 4 },
            { id: "20", category: "职责拆解", status: "completed", priority: 4 },
            { id: "21", category: "难点挑战", status: "completed", priority: 5 },
            { id: "22", category: "技术实现", status: "completed", priority: 5 },
            { id: "23", category: "协作沟通", status: "completed", priority: 3 },
            { id: "24", category: "反思与优化", status: "completed", priority: 4 }
          ],
          _count: {
            cards: 6,
            documents: 0
          }
        }
      ]

      // 根据状态筛选
      const filteredProjects = status === "all" 
        ? mockProjects 
        : mockProjects.filter(project => project.status === status)

      return NextResponse.json({ projects: filteredProjects })
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
        status: status
      },
      include: {
        cards: {
          select: {
            id: true,
            category: true,
            status: true,
            priority: true
          }
        },
        _count: {
          select: {
            cards: true,
            documents: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 创建新项目
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, role, description, timeRange, techStack } = body

    if (!name || !role || !description) {
      return NextResponse.json(
        { error: "项目名称、角色和描述为必填项" },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name,
        role,
        description,
        timeRange: timeRange || null,
        techStack: techStack || null
      }
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Failed to create project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
