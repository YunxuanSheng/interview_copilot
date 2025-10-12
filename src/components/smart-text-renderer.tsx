"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface SmartTextRendererProps {
  text: string
  className?: string
}

export function SmartTextRenderer({ text, className = "" }: SmartTextRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // 检测代码块的正则表达式
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
  const inlineCodeRegex = /`([^`]+)`/g

  // 处理代码块复制
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      toast.success("代码已复制到剪贴板！")
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      toast.error("复制失败，请手动复制")
    }
  }

  // 渲染文本内容
  const renderText = (text: string) => {
    let lastIndex = 0
    const elements: React.ReactNode[] = []
    let match

    // 重置正则表达式的lastIndex
    codeBlockRegex.lastIndex = 0

    // 处理代码块
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const [fullMatch, language, code] = match
      const startIndex = match.index
      const endIndex = startIndex + fullMatch.length

      // 添加代码块前的文本
      if (startIndex > lastIndex) {
        const beforeText = text.slice(lastIndex, startIndex)
        elements.push(renderInlineCode(beforeText))
      }

      // 添加代码块
      elements.push(
        <div key={`code-${startIndex}`} className="my-4">
          <div className="relative">
            <button
              onClick={() => handleCopyCode(code.trim())}
              className="absolute top-2 right-2 p-2 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors flex items-center gap-1 z-10"
              title="复制代码"
            >
              {copiedCode === code.trim() ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              复制
            </button>
            <pre className="bg-gray-100 p-4 rounded font-mono text-sm overflow-x-auto whitespace-pre">
              <code className={language ? `language-${language}` : ""}>
                {code.trim()}
              </code>
            </pre>
          </div>
        </div>
      )

      lastIndex = endIndex
    }

    // 添加剩余的文本
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex)
      elements.push(renderInlineCode(remainingText))
    }

    return elements.length > 0 ? elements : text
  }

  // 渲染行内代码
  const renderInlineCode = (text: string) => {
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match

    // 重置正则表达式的lastIndex
    inlineCodeRegex.lastIndex = 0

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      const [fullMatch, code] = match
      const startIndex = match.index
      const endIndex = startIndex + fullMatch.length

      // 添加代码前的文本
      if (startIndex > lastIndex) {
        parts.push(text.slice(lastIndex, startIndex))
      }

      // 添加行内代码
      parts.push(
        <code
          key={`inline-${startIndex}`}
          className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono"
        >
          {code}
        </code>
      )

      lastIndex = endIndex
    }

    // 添加剩余文本
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts.length > 0 ? parts : text
  }

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {renderText(text)}
    </div>
  )
}
