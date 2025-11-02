"use client"

import { useEffect } from "react"
import Dashboard from "@/components/dashboard"
import { useAnalytics } from "@/hooks/useAnalytics"

export default function Home() {
  const { trackPageView } = useAnalytics({ autoTrackPageView: true })

  useEffect(() => {
    // 首页访问埋点
    trackPageView(window.location.href, {
      page: 'home',
      section: 'dashboard',
    })
  }, [trackPageView])

  return <Dashboard />
}