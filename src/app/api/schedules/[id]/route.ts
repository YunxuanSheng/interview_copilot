import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: scheduleId } = await params

    // 如果是demo用户，返回模拟数据
    if (session.user.email === "demo@example.com") {
      const mockSchedules = [
        {
          id: "1",
          company: "腾讯",
          position: "前端开发工程师",
          department: "技术部",
          interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
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
          interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
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
          interviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
          interviewDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          interviewLink: "https://meeting.meituan.com/room/345678",
          round: 1,
          tags: "技术面试,后端,Go",
          notes: "第一轮面试，主要考察Go语言和微服务架构",
          status: "scheduled",
          createdAt: new Date().toISOString()
        }
      ]

      const schedule = mockSchedules.find(s => s.id === scheduleId)
      
      if (!schedule) {
        return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
      }

      return NextResponse.json(schedule)
    }

    const schedule = await prisma.interviewSchedule.findFirst({
      where: {
        id: scheduleId,
        userId: session.user.id
      }
    })

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Get schedule error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: scheduleId } = await params

    const body = await request.json()
    const {
      company,
      position,
      department,
      interviewDate,
      interviewLink,
      round,
      tags,
      notes,
      status
    } = body

    // 如果是demo用户，返回模拟更新后的数据
    if (session.user.email === "demo@example.com") {
      const updatedSchedule = {
        id: scheduleId,
        company: company || "腾讯",
        position: position || "前端开发工程师",
        department: department || "技术部",
        interviewDate: interviewDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        interviewLink: interviewLink || "https://meeting.tencent.com/room/123456",
        round: round || 1,
        tags: tags || "技术面试,前端,React",
        notes: notes || "第一轮技术面试，主要考察前端基础知识和React框架使用",
        status: status || "scheduled",
        createdAt: new Date().toISOString()
      }
      return NextResponse.json(updatedSchedule)
    }

    const schedule = await prisma.interviewSchedule.update({
      where: {
        id: scheduleId,
        userId: session.user.id
      },
      data: {
        company,
        position,
        department,
        interviewDate: new Date(interviewDate),
        interviewLink,
        round,
        tags,
        notes,
        status
      }
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Update schedule error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: scheduleId } = await params

    await prisma.interviewSchedule.delete({
      where: {
        id: scheduleId,
        userId: session.user.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete schedule error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
