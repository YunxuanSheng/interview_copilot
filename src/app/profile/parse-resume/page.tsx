"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Upload, FileText, Sparkles, User, GraduationCap, Briefcase, Code, MapPin, Phone, Mail } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ParsedResume {
  personalInfo: {
    name: string
    email: string
    phone: string
    location: string
    summary: string
  }
  educations: Array<{
    school: string
    degree: string
    major: string
    startDate: string
    endDate: string
    description: string
  }>
  workExperiences: Array<{
    company: string
    position: string
    startDate: string
    endDate: string
    description: string
    achievements: string
  }>
  skills: Array<{
    name: string
    level: string
    category: string
  }>
}

export default function ResumeParsePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [, _setIsUploading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState("")
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setResumeFile(file)
      toast.success("简历文件上传成功")
    }
  }

  const handleTextUpload = () => {
    if (!resumeText.trim()) {
      toast.error("请输入简历内容")
      return
    }

    setIsParsing(true)
    
    try {
      // 模拟简历解析
      const mockParsedData: ParsedResume = {
        personalInfo: {
          name: "张三",
          email: "zhangsan@example.com",
          phone: "138-0000-0000",
          location: "北京市",
          summary: "3年前端开发经验，熟练掌握React、Vue等前端框架，有丰富的项目开发经验。"
        },
        educations: [
          {
            school: "清华大学",
            degree: "本科",
            major: "计算机科学与技术",
            startDate: "2018-09",
            endDate: "2022-06",
            description: "主修课程：数据结构、算法、操作系统、计算机网络等"
          }
        ],
        workExperiences: [
          {
            company: "腾讯",
            position: "前端开发工程师",
            startDate: "2022-07",
            endDate: "2024-12",
            description: "负责公司核心产品的前端开发工作，使用React + TypeScript技术栈",
            achievements: "主导开发了用户管理系统，提升了30%的开发效率；优化了页面加载速度，减少了50%的首屏加载时间"
          }
        ],
        skills: [
          { name: "React", level: "expert", category: "technical" },
          { name: "TypeScript", level: "advanced", category: "technical" },
          { name: "Vue.js", level: "advanced", category: "technical" },
          { name: "JavaScript", level: "expert", category: "technical" },
          { name: "Node.js", level: "intermediate", category: "technical" },
          { name: "英语", level: "intermediate", category: "language" }
        ]
      }

      setTimeout(() => {
        setParsedData(mockParsedData)
        setIsParsing(false)
        toast.success("简历解析成功！")
      }, 2000)
    } catch (error) {
      console.error("Parse resume error:", error)
      toast.error("解析失败，请重试")
      setIsParsing(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!parsedData) return

    setIsSaving(true)
    
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...parsedData.personalInfo,
          educations: parsedData.educations,
          workExperiences: parsedData.workExperiences,
          skills: parsedData.skills
        }),
      })

      if (response.ok) {
        toast.success("个人档案更新成功！")
        router.push("/profile")
      } else {
        toast.error("保存失败，请重试")
      }
    } catch (error) {
      console.error("Save profile error:", error)
      toast.error("保存失败，请重试")
    } finally {
      setIsSaving(false)
    }
  }

  const sampleResume = `张三
前端开发工程师
电话：138-0000-0000
邮箱：zhangsan@example.com
地址：北京市朝阳区

个人简介：
3年前端开发经验，熟练掌握React、Vue等前端框架，有丰富的项目开发经验。热爱技术，善于学习新技术，具备良好的团队协作能力。

教育经历：
2018.09 - 2022.06  清华大学  计算机科学与技术  本科
主修课程：数据结构、算法、操作系统、计算机网络等

工作经历：
2022.07 - 2024.12  腾讯  前端开发工程师
负责公司核心产品的前端开发工作，使用React + TypeScript技术栈
主要成就：
- 主导开发了用户管理系统，提升了30%的开发效率
- 优化了页面加载速度，减少了50%的首屏加载时间

技能专长：
- React (精通)
- TypeScript (熟练)
- Vue.js (熟练)
- JavaScript (精通)
- Node.js (了解)
- 英语 (良好)`

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可使用简历解析功能</p>
          <Button asChild>
            <Link href="/auth/signin">立即登录</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/profile">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">智能简历解析</h1>
          <p className="text-gray-600 mt-1">上传简历文件或粘贴简历内容，AI自动解析个人信息</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 简历输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              简历输入
            </CardTitle>
            <CardDescription>
              上传简历文件或粘贴简历内容
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">文本输入</TabsTrigger>
                <TabsTrigger value="file">文件上传</TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resumeText">简历内容</Label>
                  <Textarea
                    id="resumeText"
                    placeholder="请粘贴您的简历内容..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleTextUpload} 
                    disabled={isParsing || !resumeText.trim()}
                    className="flex-1"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isParsing ? "AI解析中..." : "AI智能解析"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setResumeText(sampleResume)}
                  >
                    示例简历
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="file" className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-4">
                    支持PDF、Word、TXT等格式
                  </p>
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    选择文件
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                
                {resumeFile && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">文件已上传</span>
                    </div>
                    <p className="text-sm text-green-700">{resumeFile.name}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 解析结果区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              解析结果
            </CardTitle>
            <CardDescription>
              AI解析出的个人信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!parsedData ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>请输入简历内容并点击解析</p>
                <p className="text-sm">AI将自动提取个人信息</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 个人信息 */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    个人信息
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium w-16">姓名：</span>
                      <span>{parsedData.personalInfo.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium w-16">邮箱：</span>
                      <span>{parsedData.personalInfo.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="font-medium w-16">电话：</span>
                      <span>{parsedData.personalInfo.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium w-16">地址：</span>
                      <span>{parsedData.personalInfo.location}</span>
                    </div>
                    <div>
                      <span className="font-medium">简介：</span>
                      <p className="text-gray-600 mt-1">{parsedData.personalInfo.summary}</p>
                    </div>
                  </div>
                </div>

                {/* 教育经历 */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    教育经历 ({parsedData.educations.length})
                  </h4>
                  <div className="space-y-3">
                    {parsedData.educations.map((edu, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium">{edu.school}</div>
                        <div className="text-sm text-gray-600">{edu.degree} · {edu.major}</div>
                        <div className="text-xs text-gray-500">{edu.startDate} - {edu.endDate}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 工作经历 */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    工作经历 ({parsedData.workExperiences.length})
                  </h4>
                  <div className="space-y-3">
                    {parsedData.workExperiences.map((work, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium">{work.company}</div>
                        <div className="text-sm text-gray-600">{work.position}</div>
                        <div className="text-xs text-gray-500">{work.startDate} - {work.endDate}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 技能 */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    技能专长 ({parsedData.skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.skills.map((skill, index) => (
                      <span 
                        key={index} 
                        className={`px-2 py-1 rounded text-xs ${
                          skill.level === 'expert' ? 'bg-red-100 text-red-800' :
                          skill.level === 'advanced' ? 'bg-orange-100 text-orange-800' :
                          skill.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? "保存中..." : "保存到个人档案"}
                  </Button>
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-medium mb-2">上传简历</h3>
              <p className="text-sm text-gray-600">上传简历文件或粘贴简历文本内容</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-medium mb-2">AI解析</h3>
              <p className="text-sm text-gray-600">AI自动提取个人信息、教育经历、工作经历等</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-medium mb-2">保存档案</h3>
              <p className="text-sm text-gray-600">一键保存到个人档案，完善个人信息</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
