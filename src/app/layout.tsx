import "./globals.css"
import AuthProvider from "@/components/auth-provider"
import Navigation from "@/components/navigation"
import { Toaster } from "@/components/ui/sonner"
import Link from "next/link"

export const metadata = {
  title: "GoGoInterview",
  description: "基于AI的智能面试管理平台",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans" suppressHydrationWarning={true}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navigation />
            <main className="flex-1 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 w-full">
              {children}
            </main>
            {/* Footer with legal links */}
            <footer className="bg-gray-50 border-t mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                  <div className="text-sm text-gray-500">
                    © 2024 GoGoInterview. 保留所有权利.
                  </div>
                  <div className="flex space-x-6 text-sm">
                    <Link href="/privacy" className="text-gray-500 hover:text-gray-700">
                      隐私政策
                    </Link>
                    <Link href="/terms" className="text-gray-500 hover:text-gray-700">
                      用户服务协议
                    </Link>
                  </div>
                </div>
              </div>
            </footer>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}