import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  // 本地开发时自动使用 localhost:3000
  ...(process.env.NODE_ENV === 'development' && {
    debug: true, // 开发模式下启用调试
  }),
  providers: [
    // Demo模式跳过认证
    CredentialsProvider({
      id: "demo",
      name: "Demo Mode",
      credentials: {
        demo: { label: "Demo", type: "text" }
      },
      async authorize(credentials) {
        try {
          console.log("Demo mode authorize called with:", credentials)
          console.log("Environment:", process.env.NODE_ENV)
          console.log("Database URL exists:", !!process.env.DATABASE_URL)
          
          // 临时跳过数据库连接检查，让 Demo 模式先工作
          console.log("Demo mode: skipping database check for now")
          
          // Demo模式：任何输入都允许登录
          if (credentials?.demo === "demo") {
            console.log("Demo credentials valid, using mock user...")
            
            // 临时使用模拟用户，不依赖数据库
            const result = {
              id: "demo-user-123",
              email: "demo@example.com",
              name: "Demo用户",
              image: null,
            }
            console.log("Demo authorization successful:", result)
            return result
          }
          
          console.log("Demo credentials invalid")
          return null
        } catch (error) {
          console.error("Demo mode authorization error:", error)
          return null
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log("[Auth] Credentials authorize called with email:", credentials?.email)
          
          if (!credentials?.email || !credentials?.password) {
            console.log("[Auth] Credentials missing email or password")
            throw new Error("邮箱和密码不能为空")
          }

          // 检查数据库连接
          try {
            await prisma.$connect()
          } catch (dbError) {
            console.error("[Auth] Database connection error:", dbError)
            throw new Error("数据库连接失败，请检查配置")
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email.toLowerCase().trim() // 统一转换为小写并去除空格
            }
          })

          if (!user) {
            console.log("[Auth] User not found:", credentials.email)
            throw new Error("用户不存在，请先注册")
          }

          if (!user.password) {
            console.log("[Auth] User has no password set:", credentials.email)
            throw new Error("该账户未设置密码，请使用其他方式登录")
          }

          // 验证密码
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          
          if (!isValidPassword) {
            console.log("[Auth] Invalid password for user:", credentials.email)
            throw new Error("密码错误")
          }

          console.log("[Auth] Credentials authorization successful for user:", user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error("[Auth] Credentials authorization error:", error)
          // 重新抛出错误，让NextAuth可以处理
          throw error
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
    // 添加 signIn callback 来处理错误
    async signIn({ user, account, profile: _profile }) {
      console.log("[Auth] signIn callback called:", { user, account: account?.provider })
      return true
    }
  },
  // 添加事件处理来记录错误
  events: {
    async signIn({ user, account, profile: _profile, isNewUser }: { user: any; account: any; profile?: any; isNewUser?: boolean }) {
      console.log("[Auth] User signed in:", { 
        userId: user.id, 
        email: user.email, 
        provider: account?.provider,
        isNewUser 
      })
    },
    async signOut() {
      console.log("[Auth] User signed out")
    }
  }
}
