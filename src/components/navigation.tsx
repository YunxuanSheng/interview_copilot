"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Calendar,
  FileText,
  Home,
  User,
  BookOpen,
  LogOut,
  Menu,
  X,
  FolderOpen,
  Share2
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"

const navigation = [
  { name: "首页", href: "/", icon: Home },
  { name: "面试进度管理", href: "/schedules", icon: Calendar },
  { name: "面试复盘", href: "/interviews", icon: FileText },
  { name: "我的面经", href: "/experiences", icon: BookOpen },
  { name: "面经广场", href: "/interview-sharings", icon: Share2 },
  { name: "项目整理", href: "/projects", icon: FolderOpen },
]

interface CreditsStatus {
  creditsBalance: number
  dailyUsed: number
  monthlyUsed: number
  dailyRemaining: number
  monthlyRemaining: number
  dailyLimit: number
  monthlyLimit: number
}

export default function Navigation() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [creditsStatus, setCreditsStatus] = useState<CreditsStatus | null>(null)
  const [creditsLoading, setCreditsLoading] = useState(false)

  // 获取credits状态
  const fetchCreditsStatus = useCallback(async () => {
    if (!session?.user || !('id' in session.user)) return
    
    setCreditsLoading(true)
    try {
      const response = await fetch('/api/credits')
      const data = await response.json()
      
      if (data.success) {
        setCreditsStatus(data.data)
      }
    } catch (error) {
      console.error('获取credits状态失败:', error)
    } finally {
      setCreditsLoading(false)
    }
  }, [session?.user])

  // 当用户登录时获取credits状态
  useEffect(() => {
    if (session?.user && 'id' in session.user) {
      fetchCreditsStatus()
    }
  }, [session?.user, fetchCreditsStatus])

  // 调试信息
  console.log("Navigation - Session status:", status)
  console.log("Navigation - Session data:", session)

  if (!session) {
    return null
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="font-semibold text-gray-900">面试助理</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                    <AvatarFallback>
                      {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user?.name || "用户"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                    
                    {/* Credits显示 - 简化样式 */}
                    <div className="bg-gray-50 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">Credits</span>
                        {creditsLoading ? (
                          <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                        ) : creditsStatus ? (
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {creditsStatus.creditsBalance.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              今日: {creditsStatus.dailyUsed}/{creditsStatus.dailyLimit}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">加载中...</div>
                        )}
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    个人档案
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={async () => {
                    await signOut({ redirect: false })
                    // 使用router进行跳转，避免白屏问题
                    router.push("/auth/signin")
                    router.refresh()
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block pl-3 pr-4 py-2 text-base font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
