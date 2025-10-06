'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Navbar from '@/components/Navbar'
import { hasAdminAccess } from '@/lib/permissions'
import { parseVideoTitle } from '@/lib/video-parser'

interface VideoInput {
  title: string
  description: string
  m3u8Url: string
  thumbnail: string
  category?: string
  author?: string
}

export default function BatchImportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [textInput, setTextInput] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      alert('只有管理员可以批量导入视频')
      router.push('/videos')
    }
  }, [status, session, router])

  // 获取分类列表
  useEffect(() => {
    if (status === 'authenticated') {
      fetchCategories()
    }
  }, [status])

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/admin/categories')
      setCategories(response.data.categories)
    } catch (error) {
      console.error('获取分类列表失败:', error)
      // 使用默认分类
      setCategories(['影视', '动漫', '综艺', '纪录片', '教育', '音乐', '游戏', '体育', '科技', '生活', '美食', '旅游', '其他'])
    }
  }

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

  if (session?.user?.role !== 'admin') {
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
        const rawTitle = parts[0]
        const { cleanTitle, author } = parseVideoTitle(rawTitle)
        
        videos.push({
          title: cleanTitle,
          m3u8Url: parts[1],
          thumbnail: parts[2] || '',
          description: parts[3] || '',
          author: author || undefined,
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
      
      // 为所有视频添加统一的分类
      const videosWithCategory = videos.map(v => ({
        ...v,
        category: category || undefined,
      }))
      
      const response = await axios.post('/api/videos/batch', { videos: videosWithCategory })
      
      alert(`成功导入 ${response.data.count} 个视频！`)
      router.push('/videos')
    } catch (error: any) {
      setError(error.response?.data?.error || '批量导入失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const exampleText = `精彩视频1-张三|https://example.com/video1.m3u8|https://example.com/thumb1.jpg|这是第一个视频
示例视频2|https://example.com/video2.m3u8
热门视频3-[李四]|https://example.com/video3.m3u8|https://example.com/thumb3.jpg`

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
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                统一分类（可选）
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择分类（可不选）</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                选择后将应用到所有导入的视频
              </p>
            </div>

            <div>
              <label htmlFor="textInput" className="block text-sm font-medium text-gray-700 mb-2">
                批量视频信息
              </label>
              <textarea
                id="textInput"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="粘贴视频信息，每行一个视频... 提示：标题末尾添加 '-作者名' 或 '-[作者名]' 可自动识别作者"
              />
              <p className="mt-2 text-sm text-gray-600">
                将解析 {parseVideoInput(textInput).length} 个视频
                {parseVideoInput(textInput).some(v => v.author) && (
                  <span className="ml-2 text-green-600">
                    （已自动识别 {parseVideoInput(textInput).filter(v => v.author).length} 个作者）
                  </span>
                )}
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 px-6 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black text-lg shadow-lg hover:scale-105 active:scale-95 disabled:hover:scale-100"
                style={{
                  background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                  color: '#ffffff',
                  border: '2px solid rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #1d4ed8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #3b82f6, #2563eb)';
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    导入中...
                  </span>
                ) : '📦 批量导入'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/videos')}
                className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-bold shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
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
