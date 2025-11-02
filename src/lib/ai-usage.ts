import { prisma } from '@/lib/prisma'
import { checkCredits, deductCredits, CREDITS_COST } from '@/lib/credits'
import { SERVICE_MODEL_MAP, estimateServiceCost, type ModelName } from '@/lib/model-cost'

export type ServiceType = 'interview_analysis' | 'audio_transcription' | 'suggestion_generation' | 'job_parsing' | 'resume_parsing' | 'email_parsing'

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
      // 重新检查credits状态，获取最新信息
      const latestCheck = await checkCredits(userId, serviceType)
      return {
        canUse: false,
        reason: latestCheck.reason || '扣除credits失败，请稍后重试',
        creditsInfo: {
          creditsBalance: latestCheck.creditsBalance,
          dailyUsed: latestCheck.dailyUsed,
          monthlyUsed: latestCheck.monthlyUsed,
          dailyRemaining: latestCheck.dailyRemaining,
          monthlyRemaining: latestCheck.monthlyRemaining
        }
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

    // 记录模型调用日志（估算成本）
    const modelConfig = SERVICE_MODEL_MAP[serviceType]
    if (modelConfig) {
      const estimatedCost = estimateServiceCost(serviceType)
      await prisma.modelCallLog.create({
        data: {
          userId,
          serviceType,
          modelName: modelConfig.model,
          provider: modelConfig.model === 'tencent-asr' ? 'tencent' : 'dashscope',
          promptTokens: modelConfig.estimatedPromptTokens || 0,
          completionTokens: modelConfig.estimatedCompletionTokens || 0,
          totalTokens: (modelConfig.estimatedPromptTokens || 0) + (modelConfig.estimatedCompletionTokens || 0),
          estimatedCost,
          creditsUsed: CREDITS_COST[serviceType as keyof typeof CREDITS_COST] || 0
        }
      }).catch(error => {
        // 忽略记录失败，不影响主要功能
        console.error('记录模型调用日志失败:', error)
      })
    }

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
