"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Mic, Sparkles } from "lucide-react"
import { toast } from "sonner"

export default function TestAudioPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [transcript, setTranscript] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAudioFile(file)
      toast.success(`文件已选择: ${file.name}`)
    }
  }

  const handleTranscribe = async () => {
    if (!audioFile) {
      toast.error("请先选择音频文件")
      return
    }

    setIsUploading(true)
    
    try {
      console.log("开始上传文件:", audioFile.name, audioFile.size, audioFile.type)
      
      const formData = new FormData()
      formData.append('audio', audioFile)
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        body: formData,
      })

      console.log("响应状态:", response.status)
      const result = await response.json()
      console.log("响应结果:", result)

      if (response.ok && result.success) {
        const transcriptData = result.data
        setTranscript(transcriptData.transcript)
        
        // 显示说话人识别结果
        if (transcriptData.speakers && transcriptData.speakers.length > 0) {
          toast.success(`语音转文字完成！识别出 ${transcriptData.speakers.length} 个说话人：${transcriptData.speakers.join('、')}`)
        } else {
          toast.success("语音转文字完成")
        }
      } else {
        throw new Error(result.message || "转文字失败")
      }
    } catch (error) {
      console.error("转文字错误:", error)
      toast.error(`转文字失败: ${error instanceof Error ? error.message : "未知错误"}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            语音转文字测试
          </CardTitle>
          <CardDescription>
            测试 OpenAI Whisper API 的语音转文字功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">选择音频文件</label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/mp4,audio/x-m4a,audio/ogg,audio/webm"
                onChange={handleFileUpload}
              />
            </div>

            {audioFile && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">文件已选择</span>
                </div>
                <p className="text-sm text-green-700">{audioFile.name}</p>
                <p className="text-xs text-green-600">
                  {(audioFile.size / 1024 / 1024).toFixed(2)} MB · {audioFile.type}
                </p>
              </div>
            )}

            <Button 
              onClick={handleTranscribe} 
              disabled={isUploading || !audioFile}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isUploading ? "转文字中..." : "开始转文字"}
            </Button>
          </div>

          {transcript && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">转文字结果</label>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="text-sm whitespace-pre-wrap">
                  {transcript.split('\n').map((line, index) => {
                    // 检查是否是说话人标识行
                    if (line.includes(':') && (line.includes('面试官') || line.includes('候选人'))) {
                      const [speaker, ...content] = line.split(':')
                      const isInterviewer = speaker.includes('面试官')
                      return (
                        <div key={index} className={`mb-3 p-3 rounded-lg ${
                          isInterviewer 
                            ? 'bg-blue-50 border-l-4 border-blue-400' 
                            : 'bg-green-50 border-l-4 border-green-400'
                        }`}>
                          <div className={`font-semibold text-sm mb-1 ${
                            isInterviewer ? 'text-blue-800' : 'text-green-800'
                          }`}>
                            {speaker.trim()}
                          </div>
                          <div className="text-gray-800">
                            {content.join(':').trim()}
                          </div>
                        </div>
                      )
                    }
                    // 普通文本行
                    return (
                      <div key={index} className="mb-2 text-gray-700">
                        {line}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}