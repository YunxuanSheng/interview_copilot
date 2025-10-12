import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        educations: true,
        workExperiences: true,
        skills: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
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
      const user = await tx.user.update({
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
          data: educations.map((edu: any) => ({
            userId: session.user.id,
            school: edu.school,
            degree: edu.degree,
            major: edu.major,
            startDate: new Date(edu.startDate),
            endDate: edu.endDate ? new Date(edu.endDate) : null,
            description: edu.description
          }))
        })
      }

      // 创建新的工作经历
      if (workExperiences && workExperiences.length > 0) {
        await tx.workExperience.createMany({
          data: workExperiences.map((work: any) => ({
            userId: session.user.id,
            company: work.company,
            position: work.position,
            startDate: new Date(work.startDate),
            endDate: work.endDate ? new Date(work.endDate) : null,
            description: work.description,
            achievements: work.achievements
          }))
        })
      }

      // 创建新的技能
      if (skills && skills.length > 0) {
        await tx.skill.createMany({
          data: skills.map((skill: any) => ({
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
          workExperiences: true,
          skills: true
        }
      })
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
