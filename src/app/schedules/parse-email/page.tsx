"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, Sparkles, Calendar, Building, Briefcase, Users, Link as LinkIcon, Tag, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function EmailParsePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [emailContent, setEmailContent] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<{
    company: string
    position: string
    department?: string
    interviewDate: string
    interviewLink?: string
    round: number
    tags?: string
    notes?: string
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<{
    company: string
    position: string
    department: string
    interviewDate: string
    interviewLink: string
    round: string
    tags: string
    notes: string
  }>({
    company: "",
    position: "",
    department: "",
    interviewDate: "",
    interviewLink: "",
    round: "",
    tags: "",
    notes: ""
  })

  const handleParseEmail = async () => {
    if (!emailContent.trim()) {
      toast.error("请输入邮件内容")
      return
    }

    setIsParsing(true)
    
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "parse-email",
          data: emailContent
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const data = result.data
        // 确保轮次有默认值
        if (!data.round || data.round === 0) {
          data.round = 1
        }
        setParsedData(data)
        // 初始化编辑数据
        setEditData({
          company: data.company || "",
          position: data.position || "",
          department: data.department || "",
          interviewDate: data.interviewDate ? new Date(data.interviewDate).toISOString().slice(0, 16) : "",
          interviewLink: data.interviewLink || "",
          round: data.round ? data.round.toString() : "1",
          tags: data.tags || "",
          notes: data.notes || ""
        })
        toast.success("邮件解析成功！")
      } else {
        toast.error("解析失败，请重试")
      }
    } catch (error) {
      console.error("Parse email error:", error)
      toast.error("解析失败，请重试")
    } finally {
      setIsParsing(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // 恢复原始数据
    if (parsedData) {
      setEditData({
        company: parsedData.company || "",
        position: parsedData.position || "",
        department: parsedData.department || "",
        interviewDate: parsedData.interviewDate ? new Date(parsedData.interviewDate).toISOString().slice(0, 16) : "",
        interviewLink: parsedData.interviewLink || "",
        round: parsedData.round ? parsedData.round.toString() : "1",
        tags: parsedData.tags || "",
        notes: parsedData.notes || ""
      })
    }
  }

  const handleSaveEdit = () => {
    const updatedData = {
      company: editData.company,
      position: editData.position,
      department: editData.department || undefined,
      interviewDate: editData.interviewDate ? new Date(editData.interviewDate).toISOString() : new Date().toISOString(),
      interviewLink: editData.interviewLink || undefined,
      round: parseInt(editData.round) || 1,
      tags: editData.tags || undefined,
      notes: editData.notes || undefined
    }
    setParsedData(updatedData)
    setIsEditing(false)
    toast.success("修改已保存")
  }

  const handleSaveSchedule = async () => {
    if (!parsedData) return

    setIsSaving(true)
    
    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedData),
      })

      if (response.ok) {
        toast.success("面试安排创建成功！")
        router.push("/schedules")
      } else {
        toast.error("保存失败，请重试")
      }
    } catch (error) {
      console.error("Save schedule error:", error)
      toast.error("保存失败，请重试")
    } finally {
      setIsSaving(false)
    }
  }

  const sampleEmail = `主题：腾讯前端开发工程师面试邀请

亲爱的张三，

感谢您对我们前端开发工程师职位的关注。经过初步筛选，我们很荣幸地邀请您参加面试。

面试详情：
- 公司：腾讯
- 职位：前端开发工程师  
- 部门：技术部
- 面试时间：2024年1月15日 14:00
- 面试链接：https://meeting.tencent.com/room/123456
- 面试轮次：第1轮技术面试
- 面试官：李工程师

请提前10分钟进入会议室，准备好您的简历和相关作品。

如有任何问题，请随时联系我们。

祝好！
腾讯HR团队`

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可使用邮件解析功能</p>
          <Button asChild>
            <Link href="/auth/signin">立即登录</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/schedules">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">智能添加日程</h1>
          <p className="text-gray-600 mt-1">复制面试邮件，AI自动解析并创建面试安排</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 邮件输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              邮件内容
            </CardTitle>
            <CardDescription>
              复制粘贴面试邀请邮件，AI将自动解析关键信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailContent">邮件全文</Label>
              <Textarea
                id="emailContent"
                placeholder="请粘贴面试邀请邮件内容..."
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleParseEmail} 
                disabled={isParsing || !emailContent.trim()}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isParsing ? "AI解析中..." : "AI智能解析"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEmailContent(sampleEmail)}
              >
                示例邮件
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 解析结果区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              解析结果
            </CardTitle>
            <CardDescription>
              AI解析出的面试安排信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!parsedData ? (
              <div className="text-center py-12 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>请输入邮件内容并点击解析</p>
                <p className="text-sm">AI将自动提取面试信息</p>
              </div>
            ) : (
              <div className="space-y-4">
                {!isEditing ? (
                  <>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">解析结果</h3>
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        编辑
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">公司：</span>
                        <span>{parsedData.company}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-green-600" />
                        <span className="font-medium">职位：</span>
                        <span>{parsedData.position}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">部门：</span>
                        <span>{parsedData.department || "未指定"}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">时间：</span>
                        <span>{new Date(parsedData.interviewDate).toLocaleString('zh-CN')}</span>
                      </div>
                      
                      {parsedData.interviewLink && (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">链接：</span>
                          <a 
                            href={parsedData.interviewLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            查看面试链接
                          </a>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-red-600" />
                        <span className="font-medium">轮次：</span>
                        <span>第{parsedData.round || "未知"}轮</span>
                      </div>
                      
                      {parsedData.tags && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">标签：</span>
                          <span>{parsedData.tags}</span>
                        </div>
                      )}
                      
                      {parsedData.notes && (
                        <div>
                          <span className="font-medium">备注：</span>
                          <p className="text-sm text-gray-600 mt-1">{parsedData.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={handleSaveSchedule} 
                        disabled={isSaving}
                        className="w-full"
                      >
                        {isSaving ? "保存中..." : "创建面试安排"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">编辑信息</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                          取消
                        </Button>
                        <Button size="sm" onClick={handleSaveEdit}>
                          保存
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-company">公司</Label>
                        <input
                          id="edit-company"
                          type="text"
                          value={editData.company}
                          onChange={(e) => setEditData({...editData, company: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-position">职位</Label>
                        <input
                          id="edit-position"
                          type="text"
                          value={editData.position}
                          onChange={(e) => setEditData({...editData, position: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-department">部门</Label>
                        <input
                          id="edit-department"
                          type="text"
                          value={editData.department}
                          onChange={(e) => setEditData({...editData, department: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-date">面试时间</Label>
                        <input
                          id="edit-date"
                          type="datetime-local"
                          value={editData.interviewDate}
                          onChange={(e) => setEditData({...editData, interviewDate: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-link">面试链接</Label>
                        <input
                          id="edit-link"
                          type="url"
                          value={editData.interviewLink}
                          onChange={(e) => setEditData({...editData, interviewLink: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-round">轮次</Label>
                        <input
                          id="edit-round"
                          type="number"
                          min="1"
                          value={editData.round}
                          onChange={(e) => setEditData({...editData, round: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-tags">标签</Label>
                        <input
                          id="edit-tags"
                          type="text"
                          value={editData.tags}
                          onChange={(e) => setEditData({...editData, tags: e.target.value})}
                          placeholder="用逗号分隔多个标签"
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-notes">备注</Label>
                        <Textarea
                          id="edit-notes"
                          value={editData.notes}
                          onChange={(e) => setEditData({...editData, notes: e.target.value})}
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-medium mb-2">复制邮件</h3>
              <p className="text-sm text-gray-600">复制面试邀请邮件内容到左侧文本框</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-medium mb-2">AI解析</h3>
              <p className="text-sm text-gray-600">点击解析按钮，AI自动提取关键信息</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-medium mb-2">一键创建</h3>
              <p className="text-sm text-gray-600">确认信息无误后，一键创建面试安排</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
