"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  List, 
  MessageSquare, 
  Mic, 
  TrendingUp, 
  Lightbulb,
  Target
} from "lucide-react"

interface TableOfContentsProps {
  hasAiAnalysis?: boolean
  hasQuestions?: boolean
  hasTranscript?: boolean
  hasFeedback?: boolean
}

interface TocItem {
  id: string
  label: string
  icon: React.ReactNode
  visible: boolean
}

export function TableOfContents({ 
  hasAiAnalysis = false, 
  hasQuestions = false, 
  hasTranscript = false, 
  hasFeedback = false 
}: TableOfContentsProps) {
  const [activeSection, setActiveSection] = useState<string>("")

  const tocItems: TocItem[] = [
    {
      id: "concepts",
      label: "核心概念",
      icon: <Lightbulb className="w-4 h-4" />,
      visible: hasAiAnalysis
    },
    {
      id: "ai-analysis",
      label: "AI分析",
      icon: <Target className="w-4 h-4" />,
      visible: hasAiAnalysis
    },
    {
      id: "questions",
      label: "面试题目",
      icon: <MessageSquare className="w-4 h-4" />,
      visible: hasQuestions
    },
    {
      id: "transcript",
      label: "面试记录",
      icon: <Mic className="w-4 h-4" />,
      visible: hasTranscript
    },
    {
      id: "feedback",
      label: "反馈评价",
      icon: <TrendingUp className="w-4 h-4" />,
      visible: hasFeedback
    }
  ]

  const visibleItems = tocItems.filter(item => item.visible)

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
      setActiveSection(sectionId)
    }
  }

  // 监听滚动位置，更新当前激活的章节
  useEffect(() => {
    const handleScroll = () => {
      const sections = visibleItems.map(item => item.id)
      const scrollPosition = window.scrollY + 100

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i])
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i])
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [visibleItems])

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <List className="w-4 h-4" />
          目录导航
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <nav className="space-y-1">
          {visibleItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => scrollToSection(item.id)}
              className="w-full justify-start text-left h-8 px-2 text-xs"
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Button>
          ))}
        </nav>
      </CardContent>
    </Card>
  )
}
