'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Navbar from '@/components/Navbar'
import { hasAdminAccess } from '@/lib/permissions'

interface VideoInput {
  title: string
  description: string
  m3u8Url: string
  thumbnail: string
}

export default function BatchImportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [textInput, setTextInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && !hasAdminAccess(session?.user)) {
      alert('只有管理员可以批量导入视频')
      router.push('/videos')
    }
  }, [status, session, router])

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!hasAdminAccess(session.user)) {
    return null
  }

  const parseVideoInput = (text: string): VideoInput[] => {
    const videos: VideoInput[] = []
    const lines = text.split('\n').filter(line => line.trim())

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // 支持多种格式：
      // 格式1: title|m3u8Url
      // 格式2: title|m3u8Url|thumbnail
      // 格式3: title|m3u8Url|thumbnail|description
      const parts = line.split('|').map(p => p.trim())
      
      if (parts.length >= 2) {
        videos.push({
          title: parts[0],
          m3u8Url: parts[1],
          thumbnail: parts[2] || '',
          description: parts[3] || '',
        })
      }
    }

    return videos
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!textInput.trim()) {
      setError('请输入视频信息')
      return
    }

    try {
      const videos = parseVideoInput(textInput)
      
      if (videos.length === 0) {
        setError('没有解析到有效的视频信息，请检查格式')
        return
      }

      setLoading(true)
      const response = await axios.post('/api/videos/batch', { videos })
      
      alert(`成功导入 ${response.data.count} 个视频！`)
      router.push('/videos')
    } catch (error: any) {
      setError(error.response?.data?.error || '批量导入失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const exampleText = `示例视频1|https://example.com/video1.m3u8|https://example.com/thumb1.jpg|这是第一个视频
示例视频2|https://example.com/video2.m3u8
示例视频3|https://example.com/video3.m3u8|https://example.com/thumb3.jpg`

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">批量导入视频</h1>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">导入格式说明：</h3>
            <p className="text-sm text-blue-800 mb-2">
              每行一个视频，使用竖线（|）分隔字段，格式如下：
            </p>
            <code className="block text-sm bg-white p-3 rounded border border-blue-300 text-gray-800">
              标题|M3U8链接|封面链接（可选）|描述（可选）
            </code>
            <div className="mt-3">
              <p className="text-sm text-blue-800 mb-1">示例：</p>
              <pre className="text-xs bg-white p-3 rounded border border-blue-300 text-gray-800 overflow-x-auto whitespace-pre-wrap">
                {exampleText}
              </pre>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="textInput" className="block text-sm font-medium text-gray-700 mb-2">
                批量视频信息
              </label>
              <textarea
                id="textInput"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="粘贴视频信息，每行一个视频..."
              />
              <p className="mt-2 text-sm text-gray-600">
                将解析 {parseVideoInput(textInput).length} 个视频
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? '导入中...' : '批量导入'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/videos')}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
