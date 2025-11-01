"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false)
  const router = useRouter()

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证输入
    if (!email || !password) {
      alert("请填写邮箱和密码")
      return
    }
    
    setIsLoading(true)
    
    try {
      console.log("Attempting credentials sign in for:", email)
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      
      console.log("Sign in result:", result)
      
      if (result?.ok) {
        // 登录成功，跳转到首页
        console.log("Login successful, redirecting...")
        router.push("/")
        router.refresh()
      } else {
        // 显示更详细的错误信息
        const errorMessage = result?.error || "登录失败"
        console.error("Login failed:", errorMessage)
        
        if (errorMessage === "CredentialsSignin") {
          alert("邮箱或密码错误，请检查后重试")
        } else if (errorMessage.includes("database") || errorMessage.includes("connect")) {
          alert("数据库连接失败，请检查配置")
        } else {
          alert(`登录失败: ${errorMessage}`)
        }
      }
    } catch (error) {
      console.error("Sign in error:", error)
      alert(`登录出错: ${error instanceof Error ? error.message : "未知错误"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 注册时需要同意条款
    if (!agreeToTerms || !agreeToPrivacy) {
      alert("请先同意用户服务协议和隐私政策")
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("注册成功！请登录")
        setIsRegister(false)
        setEmail("")
        setPassword("")
        setName("")
      } else {
        alert(data.error || "注册失败")
      }
    } catch (error) {
      console.error("Register error:", error)
      alert("注册出错，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoSignIn = async () => {
    setIsLoading(true)
    
    try {
      console.log("Attempting demo sign in...")
      console.log("Environment:", process.env.NODE_ENV)
      console.log("NextAuth URL:", process.env.NEXTAUTH_URL)
      
      const result = await signIn("demo", {
        demo: "demo",
        redirect: false,
      })
      
      console.log("Demo sign in result:", result)
      
      if (result?.ok) {
        console.log("Demo login successful, redirecting...")
        // 登录成功，跳转到首页
        window.location.href = "/"
      } else {
        console.error("Demo login failed:", result?.error)
        alert(`Demo 登录失败: ${result?.error || "未知错误"}`)
      }
    } catch (error) {
      console.error("Demo sign in error:", error)
      alert(`Demo 登录出错: ${error instanceof Error ? error.message : "未知错误"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">GoGoInterview</CardTitle>
          <CardDescription>
            登录您的账户以开始管理面试
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Demo模式快速登录 */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">🚀 Demo模式</h3>
            <p className="text-sm text-green-700 mb-3">快速体验AI面试助理功能</p>
            <Button 
              onClick={handleDemoSignIn} 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {isLoading ? "登录中..." : "一键进入Demo"}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 mb-4">或使用以下方式登录</div>

          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credentials">邮箱登录</TabsTrigger>
              <TabsTrigger value="google">Google登录</TabsTrigger>
            </TabsList>
            
            <TabsContent value="credentials">
              <form onSubmit={isRegister ? handleRegister : handleCredentialsSignIn} className="space-y-4">
                {isRegister && (
                  <div className="space-y-2">
                    <Label htmlFor="name">姓名</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="请输入您的姓名"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={isRegister ? "至少6个字符" : "输入密码"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {/* 注册时的法律条款同意 */}
                {isRegister && (
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="agree-terms"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="mt-1"
                        required
                      />
                      <label htmlFor="agree-terms" className="text-xs text-gray-600 leading-relaxed">
                        我已阅读并同意
                        <Link href="/terms" target="_blank" className="text-blue-600 hover:text-blue-800 underline mx-1">
                          《用户服务协议》
                        </Link>
                      </label>
                    </div>
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="agree-privacy"
                        checked={agreeToPrivacy}
                        onChange={(e) => setAgreeToPrivacy(e.target.checked)}
                        className="mt-1"
                        required
                      />
                      <label htmlFor="agree-privacy" className="text-xs text-gray-600 leading-relaxed">
                        我已阅读并同意
                        <Link href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-800 underline mx-1">
                          《隐私政策》
                        </Link>
                        ，了解个人信息收集和使用方式
                      </label>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (isRegister ? "注册中..." : "登录中...") : (isRegister ? "注册" : "登录")}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(!isRegister)
                      setEmail("")
                      setPassword("")
                      setName("")
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {isRegister ? "已有账户？点击登录" : "没有账户？点击注册"}
                  </button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="google">
              <div className="space-y-4">
                <Button
                  onClick={handleGoogleSignIn}
                  variant="outline"
                  className="w-full"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  使用Google登录
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
