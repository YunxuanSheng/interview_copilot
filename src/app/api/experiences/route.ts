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
      const mockExperiences = [
        {
          id: "1",
          userId: session.user.id,
          company: "腾讯",
          questionType: "algorithm",
          questionText: "给定一个数组，找出其中两个数的和等于目标值，返回这两个数的索引。",
          answerText: "可以使用哈希表来解决这个问题。遍历数组，对于每个元素，计算目标值与当前元素的差值，如果这个差值在哈希表中存在，则找到了答案。时间复杂度O(n)，空间复杂度O(n)。",
          difficulty: "medium",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "2",
          userId: session.user.id,
          company: "字节跳动",
          questionType: "system_design",
          questionText: "设计一个短链接系统，如何保证短链接的唯一性和高可用性？",
          answerText: "可以使用雪花算法生成唯一ID，或者使用Base62编码。为了保证高可用性，可以使用分布式数据库和缓存，以及负载均衡。",
          difficulty: "hard",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "3",
          userId: session.user.id,
          company: "阿里巴巴",
          questionType: "technical",
          questionText: "Spring Boot的自动配置原理是什么？",
          answerText: "Spring Boot的自动配置基于@EnableAutoConfiguration注解，通过扫描classpath中的jar包，根据条件注解来决定是否创建相应的Bean。主要使用了@ConditionalOnClass、@ConditionalOnMissingBean等条件注解。",
          difficulty: "medium",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "4",
          userId: session.user.id,
          company: "美团",
          questionType: "behavioral",
          questionText: "描述一次你在项目中遇到的最大挑战，以及你是如何解决的？",
          answerText: "在之前的项目中，我们遇到了高并发下的性能问题。我通过分析发现是数据库查询效率低下导致的。我采用了数据库索引优化、查询语句优化、以及引入Redis缓存等方式，最终将响应时间从2秒降低到200毫秒。",
          difficulty: "easy",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "5",
          userId: session.user.id,
          company: "百度",
          questionType: "algorithm",
          questionText: "实现一个LRU缓存，要求get和put操作都是O(1)时间复杂度。",
          answerText: "可以使用HashMap + 双向链表的数据结构。HashMap存储key到节点的映射，双向链表维护访问顺序。最近访问的节点放在头部，最久未访问的节点放在尾部。",
          difficulty: "hard",
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "6",
          userId: session.user.id,
          company: "滴滴出行",
          questionType: "technical",
          questionText: "Flutter中的Widget树和Element树的区别是什么？",
          answerText: "Widget树是描述UI的不可变对象，Element树是Widget树的实例化，负责管理Widget的生命周期和状态。Widget树用于描述UI结构，Element树用于实际渲染和更新UI。",
          difficulty: "medium",
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
      return NextResponse.json(mockExperiences)
    }

    const experiences = await prisma.personalExperience.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(experiences)
  } catch (error) {
    console.error("Experiences API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      company,
      questionType,
      questionText,
      answerText,
      difficulty
    } = body

    const experience = await prisma.personalExperience.create({
      data: {
        userId: session.user.id,
        company,
        questionType,
        questionText,
        answerText,
        difficulty
      }
    })

    return NextResponse.json(experience)
  } catch (error) {
    console.error("Create experience error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
