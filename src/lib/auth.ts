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
          
          // 检查数据库连接
          const dbConnected = await checkDatabaseConnection()
          if (!dbConnected) {
            console.error("Database not connected, demo mode failed")
            return null
          }
          
          // Demo模式：任何输入都允许登录
          if (credentials?.demo === "demo") {
            console.log("Demo credentials valid, checking database...")
            
            // 创建或获取demo用户
            let user = await prisma.user.findUnique({
              where: { email: "demo@example.com" }
            })

            if (!user) {
              console.log("Creating demo user...")
              user = await prisma.user.create({
                data: {
                  email: "demo@example.com",
                  name: "Demo用户",
                  image: null
                }
              })
              console.log("Demo user created:", user.id)
            } else {
              console.log("Demo user found:", user.id)
            }

            const result = {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
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
