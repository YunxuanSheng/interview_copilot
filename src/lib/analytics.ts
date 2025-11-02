import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

/**
 * 事件类型定义
 */
export type EventType = 
  | 'page_view'      // 页面访问
  | 'button_click'   // 按钮点击
  | 'feature_use'    // 功能使用
  | 'error'          // 错误追踪
  | 'api_call'       // API调用
  | 'form_submit'    // 表单提交
  | 'download'       // 下载
  | 'share'          // 分享
  | 'search'         // 搜索
  | 'custom'         // 自定义事件

/**
 * 事件属性接口
 */
export interface EventProperties {
  [key: string]: any
}

/**
 * 事件记录接口
 */
export interface EventLogData {
  userId?: string
  eventType: EventType
  eventName: string
  properties?: EventProperties
  userAgent?: string
  ipAddress?: string
  pageUrl?: string
  referrer?: string
  screenWidth?: number
  screenHeight?: number
}

/**
 * 从请求中提取IP地址（支持代理）
 */
export function getClientIp(request: NextRequest): string | null {
  // 检查各种可能的IP头
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    // x-forwarded-for 可能包含多个IP，取第一个
    return forwarded.split(',')[0].trim()
  }
  if (realIp) {
    return realIp
  }
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  return null
}

/**
 * IP地址脱敏（保留前三段）
 */
export function maskIpAddress(ip: string | null | undefined): string | null {
  if (!ip) return null
  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`
  }
  // IPv6 或无效IP，返回null
  return null
}

/**
 * 通用事件记录函数（服务端）
 */
export async function trackEvent(data: EventLogData): Promise<void> {
  try {
    // 脱敏IP地址
    const maskedIp = maskIpAddress(data.ipAddress || undefined)
    
    await prisma.eventLog.create({
      data: {
        userId: data.userId || null,
        eventType: data.eventType,
        eventName: data.eventName,
        properties: data.properties ? JSON.stringify(data.properties) : null,
        userAgent: data.userAgent || null,
        ipAddress: maskedIp,
        pageUrl: data.pageUrl || null,
        referrer: data.referrer || null,
        screenWidth: data.screenWidth || null,
        screenHeight: data.screenHeight || null,
      },
    })
  } catch (error) {
    // 埋点失败不应该影响主要功能，只记录错误
    console.error('记录事件失败:', error)
  }
}

/**
 * 批量记录事件（用于批量上报）
 */
export async function trackEvents(events: EventLogData[]): Promise<void> {
  try {
    const eventData = events.map((data) => ({
      userId: data.userId || null,
      eventType: data.eventType,
      eventName: data.eventName,
      properties: data.properties ? JSON.stringify(data.properties) : null,
      userAgent: data.userAgent || null,
      ipAddress: maskIpAddress(data.ipAddress || undefined),
      pageUrl: data.pageUrl || null,
      referrer: data.referrer || null,
      screenWidth: data.screenWidth || null,
      screenHeight: data.screenHeight || null,
    }))

    await prisma.eventLog.createMany({
      data: eventData,
      skipDuplicates: true,
    })
  } catch (error) {
    console.error('批量记录事件失败:', error)
  }
}

/**
 * 记录页面访问
 */
export async function trackPageView(
  userId: string | undefined,
  pageUrl: string,
  options?: {
    referrer?: string
    userAgent?: string
    ipAddress?: string
    screenWidth?: number
    screenHeight?: number
  }
): Promise<void> {
  await trackEvent({
    userId,
    eventType: 'page_view',
    eventName: 'page_view',
    pageUrl,
    referrer: options?.referrer,
    userAgent: options?.userAgent,
    ipAddress: options?.ipAddress,
    screenWidth: options?.screenWidth,
    screenHeight: options?.screenHeight,
    properties: {
      path: pageUrl,
    },
  })
}

/**
 * 记录功能使用
 */
export async function trackFeatureUse(
  userId: string | undefined,
  featureName: string,
  properties?: EventProperties,
  options?: {
    pageUrl?: string
    userAgent?: string
    ipAddress?: string
  }
): Promise<void> {
  await trackEvent({
    userId,
    eventType: 'feature_use',
    eventName: featureName,
    properties,
    pageUrl: options?.pageUrl,
    userAgent: options?.userAgent,
    ipAddress: options?.ipAddress,
  })
}

/**
 * 记录按钮点击
 */
export async function trackButtonClick(
  userId: string | undefined,
  buttonName: string,
  properties?: EventProperties,
  options?: {
    pageUrl?: string
    userAgent?: string
  }
): Promise<void> {
  await trackEvent({
    userId,
    eventType: 'button_click',
    eventName: buttonName,
    properties,
    pageUrl: options?.pageUrl,
    userAgent: options?.userAgent,
  })
}

/**
 * 记录错误
 */
export async function trackError(
  userId: string | undefined,
  errorName: string,
  error: Error | string,
  properties?: EventProperties,
  options?: {
    pageUrl?: string
    userAgent?: string
    ipAddress?: string
  }
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error
  const errorStack = error instanceof Error ? error.stack : undefined

  await trackEvent({
    userId,
    eventType: 'error',
    eventName: errorName,
    properties: {
      ...properties,
      message: errorMessage,
      stack: errorStack,
    },
    pageUrl: options?.pageUrl,
    userAgent: options?.userAgent,
    ipAddress: options?.ipAddress,
  })
}

/**
 * 记录API调用
 */
export async function trackApiCall(
  userId: string | undefined,
  apiName: string,
  properties?: EventProperties,
  options?: {
    userAgent?: string
    ipAddress?: string
  }
): Promise<void> {
  await trackEvent({
    userId,
    eventType: 'api_call',
    eventName: apiName,
    properties,
    userAgent: options?.userAgent,
    ipAddress: options?.ipAddress,
  })
}

