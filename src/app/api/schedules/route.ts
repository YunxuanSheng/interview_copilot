import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
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
      const mockSchedules = [
        {
          id: "1",
          company: "腾讯",
          position: "前端开发工程师",
          department: "技术部",
          interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 明天
          interviewLink: "https://meeting.tencent.com/room/123456",
          round: 1,
          tags: "技术面试,前端,React",
          notes: "第一轮技术面试，主要考察前端基础知识和React框架使用",
          status: "scheduled",
          createdAt: new Date().toISOString()
        },
        {
          id: "2",
          company: "字节跳动",
          position: "全栈开发工程师",
          department: "产品技术部",
          interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 后天
          interviewLink: "https://meeting.bytedance.com/room/789012",
          round: 2,
          tags: "技术面试,全栈,Node.js",
          notes: "第二轮面试，包含算法题和系统设计",
          status: "scheduled",
          createdAt: new Date().toISOString()
        },
        {
          id: "3",
          company: "阿里巴巴",
          position: "Java开发工程师",
          department: "技术部",
          interviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 昨天
          interviewLink: "",
          round: 1,
          tags: "技术面试,Java,Spring",
          notes: "已完成第一轮面试，表现良好",
          status: "completed",
          createdAt: new Date().toISOString()
        },
        {
          id: "4",
          company: "美团",
          position: "后端开发工程师",
          department: "技术部",
          interviewDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5天后
          interviewLink: "https://meeting.meituan.com/room/345678",
          round: 1,
          tags: "技术面试,后端,Go",
          notes: "第一轮面试，主要考察Go语言和微服务架构",
          status: "scheduled",
          createdAt: new Date().toISOString()
        },
        {
          id: "5",
          company: "滴滴出行",
          position: "移动端开发工程师",
          department: "技术部",
          interviewDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2天前
          interviewLink: "",
          round: 2,
          tags: "技术面试,移动端,Flutter",
          notes: "第二轮面试已取消，时间冲突",
          status: "cancelled",
          createdAt: new Date().toISOString()
        },
        {
          id: "6",
          company: "百度",
          position: "AI算法工程师",
          department: "AI技术部",
          interviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 一周后
          interviewLink: "https://meeting.baidu.com/room/901234",
          round: 1,
          tags: "技术面试,AI,机器学习",
          notes: "第一轮面试，主要考察机器学习算法和深度学习",
          status: "scheduled",
          createdAt: new Date().toISOString()
        }
      ]
      return NextResponse.json(mockSchedules)
    }

    const schedules = await prisma.interviewSchedule.findMany({
      where: { userId: session.user.id },
      orderBy: { interviewDate: "desc" }
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Schedules API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      company,
      position,
      department,
      interviewDate,
      interviewLink,
      round,
      tags,
      notes
    } = body

    const schedule = await prisma.interviewSchedule.create({
      data: {
        userId: session.user.id,
        company,
        position,
        department,
        interviewDate: new Date(interviewDate),
        interviewLink,
        round: round || 1,
        tags,
        notes
      }
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Create schedule error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
