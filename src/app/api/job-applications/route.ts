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

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Demo 用户：返回模拟数据
    if (session.user.email === "demo@example.com") {
      const mock = [
        {
          id: "job_1",
          company: "腾讯",
          position: "前端开发工程师",
          department: "技术部",
          status: "applied",
          priority: "high",
          appliedDate: new Date().toISOString(),
          jobUrl: "https://careers.tencent.com/job/123",
          jobDescription: "负责前端开发，React/TypeScript",
          isReferral: false,
          referrerName: "",
          salary: "25k-35k*16",
          location: "深圳",
          notes: "简历已投递，等待HR回复",
          createdAt: new Date().toISOString(),
          schedules: [],
        },
      ]
      return NextResponse.json(mock)
    }

    const apps = await prisma.jobApplication.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { schedules: true },
    })

    return NextResponse.json(apps.map(mapDbToClient))
  } catch (error) {
    console.error("Job applications GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      company,
      position,
      department,
      status = "applied",
      priority = "medium",
      appliedDate,
      jobUrl,
      jobDescription,
      isReferral = false,
      referrerName,
      salary,
      location,
      notes,
    } = body

    const created = await prisma.jobApplication.create({
      data: {
        userId: session.user.id,
        companyName: company,
        positionName: position,
        department: department || null,
        status,
        priority,
        appliedDate: appliedDate ? new Date(appliedDate) : new Date(),
        jobUrl: jobUrl || null,
        jobDescription: jobDescription || null,
        isReferral,
        referrerName: referrerName || null,
        salary: salary || null,
        location: location || null,
        notes: notes || null,
      },
      include: { schedules: true },
    })

    return NextResponse.json(mapDbToClient(created))
  } catch (error) {
    console.error("Job applications POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


