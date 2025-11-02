"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Coins, 
  TrendingUp,
  Users,
  Plus,
  DollarSign
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface CreditsRankingItem {
  rank: number
  userId: string
  email: string
  name: string | null
  role: string
  creditsBalance: number
  dailyUsed: number
  monthlyUsed: number
}

interface CreditsData {
  ranking: CreditsRankingItem[]
  stats: {
    totalCredits: number
    totalDailyUsed: number
    totalMonthlyUsed: number
    totalUsers: number
  }
}

export default function AdminCreditsPage() {
  const [data, setData] = useState<CreditsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [adjustingUser, setAdjustingUser] = useState<string | null>(null)
  const [adjustAmount, setAdjustAmount] = useState("")
  const [adjustAction, setAdjustAction] = useState<"add" | "set">("add")

  useEffect(() => {
    fetchCreditsData()
  }, [])

  const fetchCreditsData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/credits")
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        toast.error("获取 Credits 数据失败")
      }
    } catch (error) {
      console.error("获取 Credits 数据失败:", error)
      toast.error("获取 Credits 数据失败")
    } finally {
      setLoading(false)
    }
  }

  const handleAdjustCredits = async () => {
    if (!adjustingUser || !adjustAmount) {
      toast.error("请填写完整信息")
      return
    }

    const amount = parseInt(adjustAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("请输入有效的数量")
      return
    }

    try {
      const response = await fetch("/api/admin/credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: adjustingUser,
          amount,
          action: adjustAction
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success(result.message)
        setAdjustingUser(null)
        setAdjustAmount("")
        fetchCreditsData()
      } else {
        toast.error(result.message || "调整失败")
      }
    } catch (error) {
      console.error("调整 Credits 失败:", error)
      toast.error("调整失败")
    }
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
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Credits 管理</h1>
        <p className="text-gray-600 mt-1">管理所有用户的 Credits</p>
      </div>

      {/* 统计卡片 */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Coins className="w-4 h-4" />
                总 Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {data.stats.totalCredits.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">所有用户余额总和</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                今日已使用
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.stats.totalDailyUsed.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">所有用户今日使用总和</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                本月已使用
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {data.stats.totalMonthlyUsed.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">所有用户本月使用总和</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                有 Credits 用户
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">拥有 Credits 记录的用户数</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Credits 排行榜 */}
      <Card>
        <CardHeader>
          <CardTitle>Credits 排行榜</CardTitle>
          <CardDescription>Credits 余额最高的用户</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          ) : data && data.ranking.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">排名</th>
                    <th className="text-left p-3">用户</th>
                    <th className="text-left p-3">角色</th>
                    <th className="text-left p-3">Credits 余额</th>
                    <th className="text-left p-3">今日使用</th>
                    <th className="text-left p-3">本月使用</th>
                    <th className="text-left p-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ranking.map((item) => (
                    <tr key={item.userId} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {item.rank <= 3 && (
                            <span className="text-lg">🏆</span>
                          )}
                          <span className="font-bold">#{item.rank}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{item.name || item.email}</div>
                          <div className="text-sm text-gray-500">{item.email}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        {item.role === "admin" ? (
                          <Badge variant="default" className="bg-blue-600">管理员</Badge>
                        ) : (
                          <Badge variant="secondary">普通用户</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium flex items-center gap-1 text-yellow-600">
                          <Coins className="w-4 h-4" />
                          {item.creditsBalance.toLocaleString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.dailyUsed}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.monthlyUsed}</span>
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAdjustingUser(item.userId)
                            setAdjustAmount("")
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          调整
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无数据
            </div>
          )}
        </CardContent>
      </Card>

      {/* 调整 Credits 对话框 */}
      {adjustingUser && data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">调整 Credits</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">用户</label>
                <div className="p-2 bg-gray-50 rounded">
                  {data.ranking.find((u) => u.userId === adjustingUser)?.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">操作类型</label>
                <Select value={adjustAction} onValueChange={(v) => setAdjustAction(v as "add" | "set")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">增加</SelectItem>
                    <SelectItem value="set">设置为</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">数量</label>
                <Input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="请输入数量"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAdjustingUser(null)
                    setAdjustAmount("")
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleAdjustCredits}>确认</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

