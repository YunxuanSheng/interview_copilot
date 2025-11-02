"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Users, 
  Coins, 
  BarChart3,
  ArrowLeft,
  Shield
} from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin?callbackUrl=/admin")
      return
    }

    // 检查管理员权限
    fetch("/api/admin/check")
      .then(async (res) => {
        const data = await res.json()
        
        // 添加调试信息
        console.log("权限检查响应:", {
          status: res.status,
          data,
          sessionUser: session.user,
          sessionRole: (session.user as any)?.role
        })
        
        if (res.status === 401) {
          setError("请先登录")
          setTimeout(() => router.push("/auth/signin?callbackUrl=/admin"), 2000)
          return
        }
        
        if (res.status === 403) {
          setError("权限不足：您不是管理员")
          setTimeout(() => router.push("/"), 3000)
          return
        }
        
        if (data.success && data.isAdmin) {
          setIsAuthorized(true)
          setError(null)
        } else {
          setError(data.message || "权限检查失败")
          setTimeout(() => router.push("/"), 3000)
        }
      })
      .catch((error) => {
        console.error("权限检查失败:", error)
        setError(`权限检查失败: ${error.message}`)
        setTimeout(() => router.push("/"), 3000)
      })
      .finally(() => setLoading(false))
  }, [session, status, router])

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">验证权限中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg border border-red-200 shadow-lg">
          <Shield className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">访问被拒绝</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="text-sm text-gray-600 space-y-1 mb-4 text-left bg-gray-50 p-3 rounded">
            <p className="font-medium text-gray-900 mb-2">可能的原因：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>您的账号不是管理员（role 不是 "admin"）</li>
              <li>尚未运行初始化脚本设置管理员</li>
              <li>Session 未正确更新，请重新登录</li>
            </ul>
          </div>
          <div className="text-xs text-gray-500 mb-4">
            <p>当前登录: {(session?.user as any)?.email || "未知"}</p>
            <p>当前角色: {(session?.user as any)?.role || "未知"}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => router.push("/")}>
              返回首页
            </Button>
            <Button onClick={() => window.location.reload()}>
              刷新重试
            </Button>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <p>如需设置管理员，请运行：</p>
            <code className="bg-gray-100 px-2 py-1 rounded">node scripts/init-admin.js</code>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">后台管理</span>
              </Link>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回前台
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* 侧边栏 */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>数据概览</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>用户管理</span>
              </Link>
              <Link
                href="/admin/credits"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              >
                <Coins className="w-5 h-5" />
                <span>Credits 管理</span>
              </Link>
              <Link
                href="/admin/reports"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                <span>数据报表</span>
              </Link>
            </nav>
          </aside>

          {/* 主内容区 */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}

