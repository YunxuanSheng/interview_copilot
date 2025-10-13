import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

// 获取单个项目详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 如果是demo用户，返回模拟数据
    if (session.user.email === "demo@example.com") {
      const mockProjectData = {
        "1": {
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
            {
              id: "1",
              category: "项目背景",
              question: "请介绍一下电商平台重构项目这个项目的背景和业务价值？",
              answer: "这个项目是为了解决公司核心电商平台技术债务问题。原系统使用jQuery开发，代码维护困难，用户体验不佳。重构后使用React+TypeScript，提升了代码可维护性，页面加载速度提升40%，用户转化率提升15%。",
              aiSuggestion: "查看项目PRD文档了解业务背景；回顾项目启动会议记录；查看产品需求文档和用户调研报告",
              status: "completed",
              tags: "核心项目,重构",
              priority: 5,
              createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: "2",
              category: "职责拆解",
              question: "你在电商平台重构项目中具体负责哪些模块？",
              answer: "我主要负责商品展示模块和购物车模块的前端开发。商品展示模块包括商品列表、详情页、图片轮播等组件；购物车模块包括添加商品、数量修改、价格计算等功能。",
              aiSuggestion: "整理个人工作日志和代码提交记录；查看项目分工文档和会议纪要；回顾与团队成员的沟通记录",
              status: "answered",
              tags: "前端开发,React",
              priority: 4,
              createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: "3",
              category: "难点挑战",
              question: "在电商平台重构项目中遇到的最大技术挑战是什么？",
              answer: "最大的挑战是数据迁移和状态管理。原系统使用jQuery直接操作DOM，新系统需要建立完整的状态管理架构。我们使用Redux Toolkit解决了复杂的状态同步问题，通过自定义hooks封装了业务逻辑。",
              aiSuggestion: "查看技术方案设计文档；回顾问题解决过程的技术笔记；整理性能测试报告和优化记录",
              status: "completed",
              tags: "技术难点,状态管理",
              priority: 5,
              createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: "4",
              category: "技术实现",
              question: "电商平台重构项目的技术架构是怎样的？",
              answer: "采用React+TypeScript+Redux的架构。组件库使用Ant Design，构建工具使用Webpack，代码规范使用ESLint+Prettier。项目采用模块化设计，每个功能模块独立开发和测试。",
              aiSuggestion: "查看项目架构图和设计文档；整理关键技术选型的调研报告；回顾代码实现的核心逻辑",
              status: "answered",
              tags: "技术架构,React",
              priority: 4,
              createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: "5",
              category: "协作沟通",
              question: "在电商平台重构项目中如何与产品经理协作？",
              answer: "",
              aiSuggestion: "查看项目沟通群聊记录；整理跨部门协作的邮件往来；回顾项目评审和复盘会议记录",
              status: "draft",
              tags: "协作,产品",
              priority: 3,
              createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: "6",
              category: "反思与优化",
              question: "如果重新做电商平台重构项目，你会如何优化？",
              answer: "",
              aiSuggestion: "整理项目总结和复盘文档；查看用户反馈和数据分析报告；回顾技术债务和改进计划",
              status: "draft",
              tags: "优化,反思",
              priority: 2,
              createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          documents: []
        },
        "2": {
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
            {
              id: "7",
              category: "项目背景",
              question: "请介绍一下微服务架构升级这个项目的背景和业务价值？",
              answer: "随着业务快速发展，原有单体应用已经无法满足高并发和快速迭代的需求。微服务架构升级后，系统可用性从99.5%提升到99.9%，新功能上线周期从2周缩短到3天。",
              aiSuggestion: "查看项目PRD文档了解业务背景；回顾项目启动会议记录；查看产品需求文档和用户调研报告",
              status: "completed",
              tags: "架构升级,微服务",
              priority: 5,
              createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: "8",
              category: "职责拆解",
              question: "你在微服务架构升级项目中具体负责哪些模块？",
              answer: "我负责用户服务和订单服务的拆分和重构。用户服务包括用户注册、登录、权限管理等功能；订单服务包括订单创建、状态管理、支付集成等核心业务逻辑。",
              aiSuggestion: "整理个人工作日志和代码提交记录；查看项目分工文档和会议纪要；回顾与团队成员的沟通记录",
              status: "completed",
              tags: "后端开发,微服务",
              priority: 5,
              createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: "9",
              category: "难点挑战",
              question: "在微服务架构升级项目中遇到的最大技术挑战是什么？",
              answer: "最大的挑战是数据一致性和服务间通信。我们使用分布式事务和事件驱动架构来解决数据一致性问题，通过消息队列实现服务间的异步通信。",
              aiSuggestion: "查看技术方案设计文档和问题解决记录；整理性能测试报告和优化过程文档；回顾技术选型的调研和决策过程",
              status: "answered",
              tags: "分布式,一致性",
              priority: 4,
              createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: "10",
              category: "技术实现",
              question: "微服务架构升级项目的技术架构是怎样的？",
              answer: "采用Spring Cloud微服务框架，使用Docker容器化部署，Kubernetes进行服务编排。数据存储使用MySQL分库分表，缓存使用Redis集群。服务注册发现使用Eureka，配置管理使用Config Server。",
              aiSuggestion: "查看项目架构图和系统设计文档；整理关键技术选型的调研报告；回顾核心代码实现和算法设计",
              status: "completed",
              tags: "Spring Cloud,容器化",
              priority: 5,
              createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: "11",
              category: "协作沟通",
              question: "在微服务架构升级项目中如何与运维团队协作？",
              answer: "与运维团队密切配合，制定了详细的部署和监控方案。我们使用Jenkins实现CI/CD，通过Prometheus和Grafana进行服务监控，建立了完善的故障处理流程。",
              aiSuggestion: "查看项目沟通群聊和邮件记录；整理跨部门协作的会议纪要；回顾项目评审和复盘会议记录",
              status: "answered",
              tags: "运维,CI/CD",
              priority: 3,
              createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: "12",
              category: "反思与优化",
              question: "如果重新做微服务架构升级项目，你会如何优化？",
              answer: "",
              aiSuggestion: "整理项目总结和复盘文档；查看用户反馈和数据分析报告；回顾技术债务和改进计划",
              status: "draft",
              tags: "优化,反思",
              priority: 2,
              createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          documents: []
        }
      }

      const project = mockProjectData[params.id as keyof typeof mockProjectData]
      
      if (!project) {
        return NextResponse.json({ error: "项目不存在" }, { status: 404 })
      }

      return NextResponse.json({ project })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        cards: {
          orderBy: [
            { priority: "desc" },
            { createdAt: "desc" }
          ]
        },
        documents: {
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Failed to fetch project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 更新项目
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, role, description, timeRange, techStack, status } = body

    // 检查项目是否存在且属于当前用户
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingProject) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }

    const project = await prisma.project.update({
      where: {
        id: params.id
      },
      data: {
        name: name || existingProject.name,
        role: role || existingProject.role,
        description: description || existingProject.description,
        timeRange: timeRange !== undefined ? timeRange : existingProject.timeRange,
        techStack: techStack !== undefined ? techStack : existingProject.techStack,
        status: status || existingProject.status
      }
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Failed to update project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 检查项目是否存在且属于当前用户
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingProject) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }

    await prisma.project.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ message: "项目删除成功" })
  } catch (error) {
    console.error("Failed to delete project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
