"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function TestAudioPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<string>("")

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAudioFile(file)
      toast.success(`文件已选择: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    }
  }

  const handleTranscribe = async () => {
    if (!audioFile) {
      toast.error("请先选择音频文件")
      return
    }

    setIsProcessing(true)
    setResult("")

    try {
      const formData = new FormData()
      formData.append('audio', audioFile)
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setResult(data.data.transcript)
          toast.success("语音转文字完成")
        } else {
          throw new Error(data.message || "转文字失败")
        }
      } else {
        throw new Error("转文字服务暂时不可用")
      }
    } catch (error) {
      console.error("Transcribe error:", error)
      toast.error("转文字失败，请重试")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>音频转文字测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="mb-4"
            />
            {audioFile && (
              <div className="text-sm text-gray-600 mb-4">
                已选择文件: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleTranscribe} 
            disabled={!audioFile || isProcessing}
            className="w-full"
          >
            {isProcessing ? "处理中..." : "开始转文字"}
          </Button>

          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">转文字结果:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm">{result}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
