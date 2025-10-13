"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export default function DebugPage() {
  const { data: session, status } = useSession()
  const [envInfo, setEnvInfo] = useState<any>({})

  useEffect(() => {
    // 获取环境信息（不包含敏感信息）
    setEnvInfo({
      nodeEnv: process.env.NODE_ENV,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    })
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">调试信息</h1>
      
      <div className="space-y-6">
        {/* 会话状态 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">会话状态</h2>
          <div className="space-y-2">
            <p><strong>状态:</strong> {status}</p>
            <p><strong>用户:</strong> {session?.user?.name || "未登录"}</p>
            <p><strong>邮箱:</strong> {session?.user?.email || "无"}</p>
            <p><strong>用户ID:</strong> {session?.user?.id || "无"}</p>
          </div>
        </div>

        {/* 环境变量 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">环境变量状态</h2>
          <div className="space-y-2">
            <p><strong>NODE_ENV:</strong> {envInfo.nodeEnv}</p>
            <p><strong>NEXTAUTH_URL:</strong> {envInfo.hasNextAuthUrl ? "✅ 已设置" : "❌ 未设置"}</p>
            <p><strong>NEXTAUTH_SECRET:</strong> {envInfo.hasNextAuthSecret ? "✅ 已设置" : "❌ 未设置"}</p>
            <p><strong>GOOGLE_CLIENT_ID:</strong> {envInfo.hasGoogleClientId ? "✅ 已设置" : "❌ 未设置"}</p>
            <p><strong>GOOGLE_CLIENT_SECRET:</strong> {envInfo.hasGoogleClientSecret ? "✅ 已设置" : "❌ 未设置"}</p>
            <p><strong>DATABASE_URL:</strong> {envInfo.hasDatabaseUrl ? "✅ 已设置" : "❌ 未设置"}</p>
          </div>
        </div>

        {/* 健康检查 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">健康检查</h2>
          <HealthCheck />
        </div>

        {/* 会话详情 */}
        {session && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">会话详情</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

function HealthCheck() {
  const [healthData, setHealthData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthData(data)
    } catch (error) {
      setHealthData({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={checkHealth}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "检查中..." : "检查健康状态"}
      </button>
      
      {healthData && (
        <div className="mt-4">
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(healthData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
