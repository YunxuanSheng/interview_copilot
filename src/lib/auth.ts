import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma, checkDatabaseConnection } from "@/lib/prisma"
// import bcrypt from "bcryptjs"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
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
          const dbConnected = true // 临时设置为 true
          
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
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        // For demo purposes, we'll skip password verification
        // In production, you should hash passwords and verify them
        return {
          id: user.id,
          email: user.email,
          name: user.name,
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
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}
