import { prisma } from '@/lib/prisma'
import { checkCredits, deductCredits } from '@/lib/credits'

export type ServiceType = 'interview_analysis' | 'audio_transcription' | 'suggestion_generation' | 'job_parsing'

/**
 * 检查并记录AI服务使用
 * @param userId 用户ID
 * @param serviceType 服务类型
 * @returns 是否可以使用服务
 */
export async function checkAndRecordAiUsage(userId: string, serviceType: ServiceType): Promise<{ canUse: boolean; reason?: string; creditsInfo?: any }> {
  try {
    // 检查credits
    const creditsCheck = await checkCredits(userId, serviceType)
    
    if (!creditsCheck.canUse) {
      return {
        canUse: false,
        reason: creditsCheck.reason,
        creditsInfo: {
          creditsBalance: creditsCheck.creditsBalance,
          dailyUsed: creditsCheck.dailyUsed,
          monthlyUsed: creditsCheck.monthlyUsed,
          dailyRemaining: creditsCheck.dailyRemaining,
          monthlyRemaining: creditsCheck.monthlyRemaining
        }
      }
    }

    // 扣除credits
    const deductSuccess = await deductCredits(userId, serviceType)
    if (!deductSuccess) {
      return {
        canUse: false,
        reason: '扣除credits失败'
      }
    }

    // 记录使用次数
    await prisma.aiUsageStat.upsert({
      where: {
        userId_serviceType: {
          userId,
          serviceType
        }
      },
      update: {
        count: {
          increment: 1
        },
        lastUsed: new Date()
      },
      create: {
        userId,
        serviceType,
        count: 1,
        lastUsed: new Date()
      }
    })

    return { canUse: true }
  } catch (error) {
    console.error('检查AI使用权限失败:', error)
    return {
      canUse: false,
      reason: '系统错误'
    }
  }
}

/**
 * 记录AI服务使用次数（兼容旧版本）
 * @param userId 用户ID
 * @param serviceType 服务类型
 */
export async function recordAiUsage(userId: string, serviceType: ServiceType) {
  try {
    await prisma.aiUsageStat.upsert({
      where: {
        userId_serviceType: {
          userId,
          serviceType
        }
      },
      update: {
        count: {
          increment: 1
        },
        lastUsed: new Date()
      },
      create: {
        userId,
        serviceType,
        count: 1,
        lastUsed: new Date()
      }
    })
  } catch (error) {
    console.error('记录AI使用次数失败:', error)
    // 不抛出错误，避免影响主要功能
  }
}

/**
 * 获取用户AI使用统计
 * @param userId 用户ID
 */
export async function getUserAiUsageStats(userId: string) {
  try {
    const usageStats = await prisma.aiUsageStat.findMany({
      where: { userId },
      orderBy: { serviceType: 'asc' }
    })

    const stats = {
      interview_analysis: 0,
      audio_transcription: 0,
      suggestion_generation: 0,
      job_parsing: 0,
      total: 0
    }

    usageStats.forEach(stat => {
      const serviceType = stat.serviceType as keyof typeof stats
      if (serviceType in stats) {
        stats[serviceType] = stat.count
        stats.total += stat.count
      }
    })

    return stats
  } catch (error) {
    console.error('获取AI使用统计失败:', error)
    return {
      interview_analysis: 0,
      audio_transcription: 0,
      suggestion_generation: 0,
      job_parsing: 0,
      total: 0
    }
  }
}
