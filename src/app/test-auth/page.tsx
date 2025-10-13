"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function TestAuthPage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handleDemoSignIn = async () => {
    setIsLoading(true)
    try {
      console.log("Testing demo sign in...")
      const result = await signIn("demo", {
        demo: "demo",
        redirect: false,
      })
      console.log("Demo sign in result:", result)
    } catch (error) {
      console.error("Demo sign in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">认证测试页面</h1>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">当前状态</h2>
          <p><strong>状态:</strong> {status}</p>
          <p><strong>用户:</strong> {session?.user?.name || "未登录"}</p>
          <p><strong>邮箱:</strong> {session?.user?.email || "无"}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">测试操作</h2>
          <div className="space-y-2">
            <Button 
              onClick={handleDemoSignIn} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "测试中..." : "测试 Demo 登录"}
            </Button>
            
            {session && (
              <Button 
                onClick={handleSignOut}
                variant="outline"
                className="w-full"
              >
                退出登录
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">调试信息</h2>
          <p className="text-sm text-gray-600">
            打开浏览器开发者工具查看控制台日志
          </p>
        </div>
      </div>
    </div>
  )
}
