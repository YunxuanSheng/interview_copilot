import { prisma } from '@/lib/prisma'

export type ServiceType = 'interview_analysis' | 'audio_transcription' | 'suggestion_generation' | 'job_parsing' | 'resume_parsing' | 'email_parsing'

// Credits消耗配置
export const CREDITS_COST = {
  interview_analysis: 10,
  audio_transcription: 5,
  suggestion_generation: 3,
  job_parsing: 2,
  resume_parsing: 3,
  email_parsing: 2
} as const

// 限制配置
export const CREDITS_LIMITS = {
  DAILY_LIMIT: 200,     // 测试期间提高每日限制
  MONTHLY_LIMIT: 2000,  // 测试期间提高每月限制
  NEW_USER_BONUS: 2000  // 测试期间给更多credits
} as const

export interface CreditsCheckResult {
  canUse: boolean
  reason?: string
  creditsBalance: number
  dailyUsed: number
  monthlyUsed: number
  dailyRemaining: number
  monthlyRemaining: number
}

/**
 * 获取或创建用户credits记录
 */
export async function getUserCredits(userId: string) {
  let userCredits = await prisma.userCredits.findUnique({
    where: { userId }
  })

  if (!userCredits) {
    // 新用户创建credits记录
    userCredits = await prisma.userCredits.create({
      data: {
        userId,
        creditsBalance: CREDITS_LIMITS.NEW_USER_BONUS,
        dailyUsed: 0,
        monthlyUsed: 0,
        lastDailyReset: new Date(),
        lastMonthlyReset: new Date()
      }
    })
  }

  return userCredits
}

/**
 * 检查用户是否可以使用指定服务
 */
export async function checkCredits(userId: string, serviceType: ServiceType): Promise<CreditsCheckResult> {
  const userCredits = await getUserCredits(userId)
  const now = new Date()
  
  // 检查是否需要重置每日/每月计数
  const needsDailyReset = isNewDay(userCredits.lastDailyReset, now)
  const needsMonthlyReset = isNewMonth(userCredits.lastMonthlyReset, now)

  let dailyUsed = userCredits.dailyUsed
  let monthlyUsed = userCredits.monthlyUsed

  // 如果需要重置，先重置计数
  if (needsDailyReset || needsMonthlyReset) {
    const updateData: any = {}
    
    if (needsDailyReset) {
      dailyUsed = 0
      updateData.dailyUsed = 0
      updateData.lastDailyReset = now
    }
    
    if (needsMonthlyReset) {
      monthlyUsed = 0
      updateData.monthlyUsed = 0
      updateData.lastMonthlyReset = now
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.userCredits.update({
        where: { userId },
        data: updateData
      })
    }
  }

  const serviceCost = CREDITS_COST[serviceType]
  const dailyRemaining = CREDITS_LIMITS.DAILY_LIMIT - dailyUsed
  const monthlyRemaining = CREDITS_LIMITS.MONTHLY_LIMIT - monthlyUsed

  // 检查各种限制
  if (userCredits.creditsBalance < serviceCost) {
    return {
      canUse: false,
      reason: 'credits不足',
      creditsBalance: userCredits.creditsBalance,
      dailyUsed,
      monthlyUsed,
      dailyRemaining,
      monthlyRemaining
    }
  }

  if (dailyUsed + serviceCost > CREDITS_LIMITS.DAILY_LIMIT) {
    return {
      canUse: false,
      reason: '已达到每日使用限制',
      creditsBalance: userCredits.creditsBalance,
      dailyUsed,
      monthlyUsed,
      dailyRemaining,
      monthlyRemaining
    }
  }

  if (monthlyUsed + serviceCost > CREDITS_LIMITS.MONTHLY_LIMIT) {
    return {
      canUse: false,
      reason: '已达到每月使用限制',
      creditsBalance: userCredits.creditsBalance,
      dailyUsed,
      monthlyUsed,
      dailyRemaining,
      monthlyRemaining
    }
  }

  return {
    canUse: true,
    creditsBalance: userCredits.creditsBalance,
    dailyUsed,
    monthlyUsed,
    dailyRemaining,
    monthlyRemaining
  }
}

/**
 * 扣除credits
 */
export async function deductCredits(userId: string, serviceType: ServiceType): Promise<boolean> {
  const serviceCost = CREDITS_COST[serviceType]
  
  try {
    // 先确保用户credits记录存在
    const userCredits = await getUserCredits(userId)
    
    // 检查credits是否足够（双重检查，防止并发问题）
    if (userCredits.creditsBalance < serviceCost) {
      console.error(`扣除credits失败: credits不足 (余额: ${userCredits.creditsBalance}, 需要: ${serviceCost})`)
      return false
    }
    
    // 更新credits，使用原子操作
    const result = await prisma.userCredits.update({
      where: { userId },
      data: {
        creditsBalance: {
          decrement: serviceCost
        },
        dailyUsed: {
          increment: serviceCost
        },
        monthlyUsed: {
          increment: serviceCost
        }
      }
    })
    
    // 验证更新后的余额不为负数（防止并发问题）
    if (result.creditsBalance < 0) {
      console.error(`扣除credits失败: 更新后余额为负数 (${result.creditsBalance})，可能存在并发问题`)
      // 回滚：恢复credits
      try {
        await prisma.userCredits.update({
          where: { userId },
          data: {
            creditsBalance: {
              increment: serviceCost
            },
            dailyUsed: {
              decrement: serviceCost
            },
            monthlyUsed: {
              decrement: serviceCost
            }
          }
        })
      } catch (rollbackError) {
        console.error('回滚credits失败:', rollbackError)
      }
      return false
    }
    
    return true
  } catch (error: any) {
    // 如果是因为记录不存在导致的错误，尝试创建记录
    if (error?.code === 'P2025' || error?.message?.includes('Record to update not found')) {
      console.warn('用户credits记录不存在，尝试创建...')
      try {
        await getUserCredits(userId)
        // 重新尝试扣除
        return await deductCredits(userId, serviceType)
      } catch (retryError) {
        console.error('重试扣除credits失败:', retryError)
        return false
      }
    }
    
    console.error('扣除credits失败:', error)
    console.error('错误详情:', {
      userId,
      serviceType,
      serviceCost,
      errorCode: error?.code,
      errorMessage: error?.message
    })
    return false
  }
}

/**
 * 获取用户credits状态
 */
export async function getCreditsStatus(userId: string) {
  const userCredits = await getUserCredits(userId)
  const now = new Date()
  
  // 检查是否需要重置
  const needsDailyReset = isNewDay(userCredits.lastDailyReset, now)
  const needsMonthlyReset = isNewMonth(userCredits.lastMonthlyReset, now)

  let dailyUsed = userCredits.dailyUsed
  let monthlyUsed = userCredits.monthlyUsed

  if (needsDailyReset || needsMonthlyReset) {
    const updateData: any = {}
    
    if (needsDailyReset) {
      dailyUsed = 0
      updateData.dailyUsed = 0
      updateData.lastDailyReset = now
    }
    
    if (needsMonthlyReset) {
      monthlyUsed = 0
      updateData.monthlyUsed = 0
      updateData.lastMonthlyReset = now
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.userCredits.update({
        where: { userId },
        data: updateData
      })
    }
  }

  return {
    creditsBalance: userCredits.creditsBalance,
    dailyUsed,
    monthlyUsed,
    dailyRemaining: CREDITS_LIMITS.DAILY_LIMIT - dailyUsed,
    monthlyRemaining: CREDITS_LIMITS.MONTHLY_LIMIT - monthlyUsed,
    dailyLimit: CREDITS_LIMITS.DAILY_LIMIT,
    monthlyLimit: CREDITS_LIMITS.MONTHLY_LIMIT
  }
}

/**
 * 检查是否是新的一天
 */
function isNewDay(lastReset: Date, now: Date): boolean {
  const lastDay = lastReset.getDate()
  const currentDay = now.getDate()
  const lastMonth = lastReset.getMonth()
  const currentMonth = now.getMonth()
  const lastYear = lastReset.getFullYear()
  const currentYear = now.getFullYear()
  
  return lastDay !== currentDay || lastMonth !== currentMonth || lastYear !== currentYear
}

/**
 * 检查是否是新的一月
 */
function isNewMonth(lastReset: Date, now: Date): boolean {
  const lastMonth = lastReset.getMonth()
  const currentMonth = now.getMonth()
  const lastYear = lastReset.getFullYear()
  const currentYear = now.getFullYear()
  
  return lastMonth !== currentMonth || lastYear !== currentYear
}

/**
 * 补充credits（管理员功能）
 */
export async function addCredits(userId: string, amount: number): Promise<boolean> {
  try {
    await prisma.userCredits.update({
      where: { userId },
      data: {
        creditsBalance: {
          increment: amount
        }
      }
    })
    return true
  } catch (error) {
    console.error('补充credits失败:', error)
    return false
  }
}
