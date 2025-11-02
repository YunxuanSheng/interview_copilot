'use client'

import { useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  getAnalyticsClient,
  track,
  trackPageView,
  trackFeatureUse,
  trackButtonClick,
  trackError,
  type EventProperties,
  type EventType,
} from '@/lib/analytics-client'

/**
 * 埋点 Hook 返回值接口
 */
export interface UseAnalyticsReturn {
  track: (eventType: EventType, eventName: string, properties?: EventProperties) => void
  trackPageView: (pageUrl?: string, properties?: EventProperties) => void
  trackFeatureUse: (featureName: string, properties?: EventProperties) => void
  trackButtonClick: (buttonName: string, properties?: EventProperties) => void
  trackError: (errorName: string, error: Error | string, properties?: EventProperties) => void
  flush: () => Promise<void>
}

/**
 * 埋点 Hook 选项
 */
export interface UseAnalyticsOptions {
  /**
   * 是否自动追踪页面访问
   */
  autoTrackPageView?: boolean
  /**
   * 是否在路由变化时自动追踪
   */
  trackRouteChanges?: boolean
}

/**
 * 埋点 Hook
 * 
 * @param options 配置选项
 * @returns 埋点方法
 * 
 * @example
 * ```tsx
 * const { trackFeatureUse, trackButtonClick } = useAnalytics()
 * 
 * const handleCreateInterview = () => {
 *   trackFeatureUse('interview_create', { company: 'XXX公司' })
 *   // ... 业务逻辑
 * }
 * ```
 */
export function useAnalytics(
  options: UseAnalyticsOptions = {}
): UseAnalyticsReturn {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { autoTrackPageView = true, trackRouteChanges = true } = options

  // 自动追踪页面访问
  useEffect(() => {
    if (autoTrackPageView && pathname) {
      trackPageView(window.location.href, {
        path: pathname,
        userId: session?.user && 'id' in session.user ? session.user.id : undefined,
      })
    }
  }, [pathname, autoTrackPageView, session])

  // 封装埋点方法，自动添加用户ID
  const trackWithUser = useCallback(
    (eventType: EventType, eventName: string, properties?: EventProperties) => {
      const enrichedProperties = {
        ...properties,
        userId: session?.user && 'id' in session.user ? session.user.id : undefined,
      }
      track(eventType, eventName, enrichedProperties)
    },
    [session]
  )

  const trackPageViewWithUser = useCallback(
    (pageUrl?: string, properties?: EventProperties) => {
      const enrichedProperties = {
        ...properties,
        userId: session?.user && 'id' in session.user ? session.user.id : undefined,
      }
      trackPageView(pageUrl, enrichedProperties)
    },
    [session]
  )

  const trackFeatureUseWithUser = useCallback(
    (featureName: string, properties?: EventProperties) => {
      const enrichedProperties = {
        ...properties,
        userId: session?.user && 'id' in session.user ? session.user.id : undefined,
      }
      trackFeatureUse(featureName, enrichedProperties)
    },
    [session]
  )

  const trackButtonClickWithUser = useCallback(
    (buttonName: string, properties?: EventProperties) => {
      const enrichedProperties = {
        ...properties,
        userId: session?.user && 'id' in session.user ? session.user.id : undefined,
      }
      trackButtonClick(buttonName, enrichedProperties)
    },
    [session]
  )

  const trackErrorWithUser = useCallback(
    (errorName: string, error: Error | string, properties?: EventProperties) => {
      const enrichedProperties = {
        ...properties,
        userId: session?.user && 'id' in session.user ? session.user.id : undefined,
      }
      trackError(errorName, error, enrichedProperties)
    },
    [session]
  )

  const flush = useCallback(async () => {
    const client = getAnalyticsClient()
    await client.flushNow()
  }, [])

  return {
    track: trackWithUser,
    trackPageView: trackPageViewWithUser,
    trackFeatureUse: trackFeatureUseWithUser,
    trackButtonClick: trackButtonClickWithUser,
    trackError: trackErrorWithUser,
    flush,
  }
}

