import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 如果是demo用户，返回成功但不实际删除
    if (session.user.email === "demo@example.com") {
      return NextResponse.json({ 
        success: true, 
        message: "演示用户数据删除成功（模拟）" 
      })
    }

    // 使用事务删除用户的所有数据
    await prisma.$transaction(async (tx) => {
      // 删除所有相关数据（由于外键约束，需要按顺序删除）
      
      // 1. 删除AI使用统计
      await tx.aiUsageStat.deleteMany({
        where: { userId: session.user.id }
      })

      // 2. 删除面试记录相关问题
      const interviewRecords = await tx.interviewRecord.findMany({
        where: {
          schedule: {
            userId: session.user.id
          }
        },
        select: { id: true }
      })

      for (const record of interviewRecords) {
        await tx.interviewQuestion.deleteMany({
          where: { interviewRecordId: record.id }
        })
      }

      // 3. 删除面试记录
      await tx.interviewRecord.deleteMany({
        where: {
          schedule: {
            userId: session.user.id
          }
        }
      })

      // 4. 删除面试分享的点赞
      const interviewSharings = await tx.interviewSharing.findMany({
        where: { userId: session.user.id },
        select: { id: true }
      })

      for (const sharing of interviewSharings) {
        await tx.interviewLike.deleteMany({
          where: { interviewSharingId: sharing.id }
        })
      }

      // 5. 删除面试分享
      await tx.interviewSharing.deleteMany({
        where: { userId: session.user.id }
      })

      // 6. 删除面试点赞记录
      await tx.interviewLike.deleteMany({
        where: { userId: session.user.id }
      })

      // 7. 删除项目卡片
      const projects = await tx.project.findMany({
        where: { userId: session.user.id },
        select: { id: true }
      })

      for (const project of projects) {
        await tx.projectCard.deleteMany({
          where: { projectId: project.id }
        })
      }

      // 8. 删除项目
      await tx.project.deleteMany({
        where: { userId: session.user.id }
      })

      // 9. 删除个人经历
      await tx.personalExperience.deleteMany({
        where: { userId: session.user.id }
      })

      // 10. 删除面试安排
      await tx.interviewSchedule.deleteMany({
        where: { userId: session.user.id }
      })

      // 11. 删除工作申请
      await tx.jobApplication.deleteMany({
        where: { userId: session.user.id }
      })

      // 12. 删除教育经历
      await tx.education.deleteMany({
        where: { userId: session.user.id }
      })

      // 13. 删除工作经历
      await tx.workExperience.deleteMany({
        where: { userId: session.user.id }
      })

      // 14. 删除技能
      await tx.skill.deleteMany({
        where: { userId: session.user.id }
      })

      // 15. 删除用户积分
      await tx.userCredits.deleteMany({
        where: { userId: session.user.id }
      })

      // 16. 删除用户会话
      await tx.session.deleteMany({
        where: { userId: session.user.id }
      })

      // 17. 删除OAuth账户
      await tx.account.deleteMany({
        where: { userId: session.user.id }
      })

      // 18. 最后删除用户
      await tx.user.delete({
        where: { id: session.user.id }
      })
    })

    return NextResponse.json({ 
      success: true, 
      message: "用户数据删除成功" 
    })
  } catch (error) {
    console.error("Data delete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
