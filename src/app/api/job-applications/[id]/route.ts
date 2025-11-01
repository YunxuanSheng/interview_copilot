import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

// 将数据库字段映射成前端所需字段
function mapDbToClient(app: any) {
  return {
    id: app.id,
    company: app.companyName,
    position: app.positionName,
    department: app.department || undefined,
    status: app.status,
    priority: app.priority,
    appliedDate: app.appliedDate?.toISOString?.() ?? app.appliedDate,
    jobUrl: app.jobUrl || undefined,
    jobDescription: app.jobDescription || undefined,
    isReferral: app.isReferral,
    referrerName: app.referrerName || undefined,
    salary: app.salary || undefined,
    location: app.location || undefined,
    notes: app.notes || undefined,
    createdAt: app.createdAt?.toISOString?.() ?? app.createdAt,
    schedules: (app.schedules || []).map((s: any) => ({
      id: s.id,
      company: s.company,
      position: s.position,
      department: s.department || undefined,
      interviewDate: s.interviewDate?.toISOString?.() ?? s.interviewDate,
      interviewLink: s.interviewLink || undefined,
      round: s.round,
      tags: s.tags || undefined,
      notes: s.notes || undefined,
      status: s.status,
      createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
      jobApplicationId: s.jobApplicationId || undefined,
    }))
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      company,
      position,
      department,
      status,
      priority,
      appliedDate,
      jobUrl,
      jobDescription,
      isReferral,
      referrerName,
      salary,
      location,
      notes,
    } = body

    // Demo 用户：返回模拟更新后的数据
    if (session.user.email === "demo@example.com") {
      const updated = {
        id,
        company: company || "蚂蚁",
        position: position || "前端开发工程师",
        department: department || undefined,
        status: status || "rejected",
        priority: priority || "medium",
        appliedDate: appliedDate || new Date().toISOString(),
        jobUrl: jobUrl || undefined,
        jobDescription: jobDescription || undefined,
        isReferral: isReferral || false,
        referrerName: referrerName || undefined,
        salary: salary || undefined,
        location: location || "国际",
        notes: notes || "牛逼",
        createdAt: new Date().toISOString(),
        schedules: []
      }
      return NextResponse.json(updated)
    }

    // 检查岗位投递是否存在且属于当前用户
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingApplication) {
      return NextResponse.json({ error: "岗位投递不存在" }, { status: 404 })
    }

    // 更新岗位投递
    const updated = await prisma.jobApplication.update({
      where: { id },
      data: {
        companyName: company !== undefined ? company : existingApplication.companyName,
        positionName: position !== undefined ? position : existingApplication.positionName,
        department: department !== undefined ? department : existingApplication.department,
        status: status !== undefined ? status : existingApplication.status,
        priority: priority !== undefined ? priority : existingApplication.priority,
        appliedDate: appliedDate ? new Date(appliedDate) : existingApplication.appliedDate,
        jobUrl: jobUrl !== undefined ? jobUrl : existingApplication.jobUrl,
        jobDescription: jobDescription !== undefined ? jobDescription : existingApplication.jobDescription,
        isReferral: isReferral !== undefined ? isReferral : existingApplication.isReferral,
        referrerName: referrerName !== undefined ? referrerName : existingApplication.referrerName,
        salary: salary !== undefined ? salary : existingApplication.salary,
        location: location !== undefined ? location : existingApplication.location,
        notes: notes !== undefined ? notes : existingApplication.notes,
      },
      include: { schedules: true },
    })

    return NextResponse.json(mapDbToClient(updated))
  } catch (error) {
    console.error("Job application PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Demo 用户：返回成功
    if (session.user.email === "demo@example.com") {
      return NextResponse.json({ success: true })
    }

    // 检查岗位投递是否存在且属于当前用户
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingApplication) {
      return NextResponse.json({ error: "岗位投递不存在" }, { status: 404 })
    }

    // 删除岗位投递
    await prisma.jobApplication.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Job application DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
