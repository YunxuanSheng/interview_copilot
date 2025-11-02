'use client'

import type { EventType, EventProperties } from '@/lib/analytics'

/**
 * 事件数据接口（客户端）
 */
export interface ClientEventData {
  eventType: EventType
  eventName: string
  properties?: EventProperties
  pageUrl?: string
  referrer?: string
}

/**
 * 客户端埋点配置
 */
interface AnalyticsConfig {
  enabled: boolean
  batchSize: number
  flushInterval: number // 毫秒
  apiEndpoint: string
}

const defaultConfig: AnalyticsConfig = {
  enabled: typeof window !== 'undefined' && process.env.NODE_ENV !== 'development',
  batchSize: 10,
  flushInterval: 5000, // 5秒
  apiEndpoint: '/api/analytics',
}

class AnalyticsClient {
  private config: AnalyticsConfig
  private eventQueue: ClientEventData[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private sessionId: string

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = { ...defaultConfig, ...config }
    this.sessionId = this.generateSessionId()
    
    // 页面卸载时上报队列中的事件
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush(true) // 同步上报
      })
    }
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    if (typeof window === 'undefined') return ''
    const stored = sessionStorage.getItem('analytics_session_id')
    if (stored) return stored
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('analytics_session_id', sessionId)
    return sessionId
  }

  /**
   * 获取设备信息
   */
  private getDeviceInfo() {
    if (typeof window === 'undefined') {
      return {
        userAgent: null,
        screenWidth: null,
        screenHeight: null,
        referrer: null,
      }
    }

    return {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      referrer: document.referrer || null,
      pageUrl: window.location.href,
    }
  }

  /**
   * 添加事件到队列
   */
  private queueEvent(event: ClientEventData): void {
    if (!this.config.enabled) return

    const deviceInfo = this.getDeviceInfo()
    const enrichedEvent: ClientEventData = {
      ...event,
      pageUrl: event.pageUrl || deviceInfo.pageUrl,
      referrer: event.referrer || deviceInfo.referrer,
      properties: {
        ...event.properties,
        sessionId: this.sessionId,
      },
    }

    this.eventQueue.push(enrichedEvent)

    // 如果队列达到批量大小，立即上报
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush()
    } else {
      // 否则启动定时器
      this.scheduleFlush()
    }
  }

  /**
   * 安排延迟上报
   */
  private scheduleFlush(): void {
    if (this.flushTimer) return

    this.flushTimer = setTimeout(() => {
      this.flush()
      this.flushTimer = null
    }, this.config.flushInterval)
  }

  /**
   * 上报队列中的事件
   */
  private async flush(sync: boolean = false): Promise<void> {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    if (sync) {
      // 同步上报（页面卸载时）
      try {
        navigator.sendBeacon(
          this.config.apiEndpoint,
          JSON.stringify({ events })
        )
      } catch (error) {
        console.error('同步上报失败:', error)
      }
    } else {
      // 异步上报
      try {
        await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events }),
        })
      } catch (error) {
        console.error('上报事件失败:', error)
        // 失败后重新加入队列（限制队列大小，避免内存溢出）
        if (this.eventQueue.length < 100) {
          this.eventQueue = [...events, ...this.eventQueue]
        }
      }
    }
  }

  /**
   * 记录事件
   */
  track(eventType: EventType, eventName: string, properties?: EventProperties): void {
    this.queueEvent({
      eventType,
      eventName,
      properties,
    })
  }

  /**
   * 记录页面访问
   */
  trackPageView(pageUrl?: string, properties?: EventProperties): void {
    this.queueEvent({
      eventType: 'page_view',
      eventName: 'page_view',
      pageUrl,
      properties,
    })
  }

  /**
   * 记录功能使用
   */
  trackFeatureUse(featureName: string, properties?: EventProperties): void {
    this.queueEvent({
      eventType: 'feature_use',
      eventName: featureName,
      properties,
    })
  }

  /**
   * 记录按钮点击
   */
  trackButtonClick(buttonName: string, properties?: EventProperties): void {
    this.queueEvent({
      eventType: 'button_click',
      eventName: buttonName,
      properties,
    })
  }

  /**
   * 记录错误
   */
  trackError(errorName: string, error: Error | string, properties?: EventProperties): void {
    const errorMessage = error instanceof Error ? error.message : error
    const errorStack = error instanceof Error ? error.stack : undefined

    this.queueEvent({
      eventType: 'error',
      eventName: errorName,
      properties: {
        ...properties,
        message: errorMessage,
        stack: errorStack,
      },
    })
  }

  /**
   * 手动上报（立即上报队列中的所有事件）
   */
  async flushNow(): Promise<void> {
    await this.flush()
  }

  /**
   * 启用/禁用埋点
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
    if (!enabled && this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    this.eventQueue = []
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }
}

// 创建单例实例
let analyticsClient: AnalyticsClient | null = null

/**
 * 获取或创建埋点客户端实例
 */
export function getAnalyticsClient(config?: Partial<AnalyticsConfig>): AnalyticsClient {
  if (!analyticsClient) {
    analyticsClient = new AnalyticsClient(config)
  }
  return analyticsClient
}

/**
 * 便捷函数：记录事件
 */
export function track(
  eventType: EventType,
  eventName: string,
  properties?: EventProperties
): void {
  getAnalyticsClient().track(eventType, eventName, properties)
}

/**
 * 便捷函数：记录页面访问
 */
export function trackPageView(pageUrl?: string, properties?: EventProperties): void {
  getAnalyticsClient().trackPageView(pageUrl, properties)
}

/**
 * 便捷函数：记录功能使用
 */
export function trackFeatureUse(featureName: string, properties?: EventProperties): void {
  getAnalyticsClient().trackFeatureUse(featureName, properties)
}

/**
 * 便捷函数：记录按钮点击
 */
export function trackButtonClick(buttonName: string, properties?: EventProperties): void {
  getAnalyticsClient().trackButtonClick(buttonName, properties)
}

/**
 * 便捷函数：记录错误
 */
export function trackError(
  errorName: string,
  error: Error | string,
  properties?: EventProperties
): void {
  getAnalyticsClient().trackError(errorName, error, properties)
}

