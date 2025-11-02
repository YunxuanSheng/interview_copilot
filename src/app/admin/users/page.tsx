"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Search, 
  Filter,
  Shield,
  UserCheck,
  UserX,
  Coins,
  Edit
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  role: string
  isActive: boolean
  createdAt: string
  credits: {
    balance: number
    dailyUsed: number
    monthlyUsed: number
  } | null
  _count: {
    interviewSchedules: number
    projects: number
    personalExperiences: number
  }
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    totalUsers: number
    activeUsers: number
    adminUsers: number
    inactiveUsers: number
  }
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [activeFilter, setActiveFilter] = useState("")
  const [page, setPage] = useState(1)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [page, search, roleFilter, activeFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20"
      })
      if (search) params.append("search", search)
      if (roleFilter) params.append("role", roleFilter)
      if (activeFilter) params.append("isActive", activeFilter)

      const response = await fetch(`/api/admin/users?${params}`)
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        toast.error("获取用户列表失败")
      }
    } catch (error) {
      console.error("获取用户列表失败:", error)
      toast.error("获取用户列表失败")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (userId: string, updates: { role?: string; isActive?: boolean; name?: string }) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          ...updates
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success("用户信息更新成功")
        setEditingUser(null)
        fetchUsers()
      } else {
        toast.error(result.message || "更新失败")
      }
    } catch (error) {
      console.error("更新用户失败:", error)
      toast.error("更新失败")
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchUsers()
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和统计 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
        <p className="text-gray-600 mt-1">管理系统中的所有用户</p>
      </div>

      {/* 统计卡片 */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data.stats.activeUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">管理员</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data.stats.adminUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">禁用用户</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.stats.inactiveUsers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>搜索和筛选</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索邮箱或姓名..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch()
                    }
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter || "all"} onValueChange={(v) => setRoleFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="所有角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有角色</SelectItem>
                <SelectItem value="user">普通用户</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activeFilter || "all"} onValueChange={(v) => setActiveFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="所有状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="true">活跃</SelectItem>
                <SelectItem value="false">禁用</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>
            共 {data?.pagination.total || 0} 个用户
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          ) : data && data.users.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">用户</th>
                      <th className="text-left p-3">角色</th>
                      <th className="text-left p-3">状态</th>
                      <th className="text-left p-3">Credits</th>
                      <th className="text-left p-3">内容统计</th>
                      <th className="text-left p-3">注册时间</th>
                      <th className="text-left p-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{user.name || user.email}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          {user.role === "admin" ? (
                            <Badge variant="default" className="bg-blue-600">
                              <Shield className="w-3 h-3 mr-1" />
                              管理员
                            </Badge>
                          ) : (
                            <Badge variant="secondary">普通用户</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {user.isActive ? (
                            <Badge variant="default" className="bg-green-600">
                              <UserCheck className="w-3 h-3 mr-1" />
                              活跃
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <UserX className="w-3 h-3 mr-1" />
                              禁用
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {user.credits ? (
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                <Coins className="w-4 h-4 text-yellow-500" />
                                {user.credits.balance}
                              </div>
                              <div className="text-xs text-gray-500">
                                今日: {user.credits.dailyUsed} | 本月: {user.credits.monthlyUsed}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">无</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <div>面试: {user._count.interviewSchedules}</div>
                            <div>项目: {user._count.projects}</div>
                            <div>面经: {user._count.personalExperiences}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-gray-600">
                            {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                          </div>
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUser(user)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            编辑
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    第 {data.pagination.page} 页，共 {data.pagination.totalPages} 页
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                      disabled={page === data.pagination.totalPages}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无用户数据
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑用户对话框 */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">编辑用户: {editingUser.email}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">角色</label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => {
                    setEditingUser({ ...editingUser, role: value })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">普通用户</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">状态</label>
                <Select
                  value={editingUser.isActive ? "true" : "false"}
                  onValueChange={(value) => {
                    setEditingUser({ ...editingUser, isActive: value === "true" })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">活跃</SelectItem>
                    <SelectItem value="false">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                >
                  取消
                </Button>
                <Button
                  onClick={() => {
                    handleUpdateUser(editingUser.id, {
                      role: editingUser.role,
                      isActive: editingUser.isActive
                    })
                  }}
                >
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

