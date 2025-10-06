'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Navbar from '@/components/Navbar'
import ThumbnailExtractor from '@/components/ThumbnailExtractor'
import { hasAdminAccess } from '@/lib/permissions'
import { parseVideoTitle } from '@/lib/video-parser'

export default function UploadVideoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    m3u8Url: '',
    thumbnail: '',
    category: '',
  })
  const [extractedAuthor, setExtractedAuthor] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      alert('只有管理员可以上传视频')
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // 当标题改变时，自动提取作者名
    if (name === 'title') {
      const { author } = parseVideoTitle(value)
      setExtractedAuthor(author)
    }
  }

  const handleThumbnailExtracted = (dataUrl: string) => {
    setFormData({
      ...formData,
      thumbnail: dataUrl,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.title || !formData.m3u8Url) {
      setError('标题和 M3U8 链接不能为空')
      return
    }

    try {
      setLoading(true)
      
      // 提取作者名并清理标题
      const { cleanTitle, author } = parseVideoTitle(formData.title)
      
      const submitData = {
        ...formData,
        title: cleanTitle,
        author: author || undefined,
        category: formData.category || undefined,
      }
      
      await axios.post('/api/videos', submitData)
      alert('视频上传成功！')
      router.push('/videos')
    } catch (error: any) {
      setError(error.response?.data?.error || '上传失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">上传视频</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                视频标题 *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入视频标题（如：精彩视频-作者名）"
              />
              {extractedAuthor && (
                <p className="mt-2 text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  已识别作者：<span className="font-medium ml-1">{extractedAuthor}</span>
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                提示：在标题末尾添加 "-作者名" 或 "-[作者名]" 可自动识别作者
              </p>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                视频分类
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择分类</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                视频描述
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入视频描述（可选）"
              />
            </div>

            <div>
              <label htmlFor="m3u8Url" className="block text-sm font-medium text-gray-700 mb-2">
                M3U8 链接 *
              </label>
              <input
                id="m3u8Url"
                name="m3u8Url"
                type="url"
                value={formData.m3u8Url}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/video.m3u8"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                封面图片
              </label>
              
              {/* 客户端封面提取 */}
              {formData.m3u8Url && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">
                    🎬 从视频自动提取封面（客户端）
                  </h4>
                  <ThumbnailExtractor
                    m3u8Url={formData.m3u8Url}
                    onThumbnailExtracted={handleThumbnailExtracted}
                  />
                </div>
              )}

              {/* 手动输入封面链接 */}
              <div>
                <label htmlFor="thumbnail" className="block text-sm text-gray-600 mb-2">
                  或者手动输入封面链接
                </label>
                <input
                  id="thumbnail"
                  name="thumbnail"
                  type="text"
                  value={formData.thumbnail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/thumbnail.jpg 或 Base64 数据（可选）"
                />
              </div>

              {/* 封面预览 */}
              {formData.thumbnail && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">封面预览：</p>
                  <img
                    src={formData.thumbnail}
                    alt="封面预览"
                    className="w-full max-w-md h-auto rounded-lg shadow-md"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect width="400" height="225" fill="%23e2e8f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="%2364748b"%3E图片加载失败%3C/text%3E%3C/svg%3E'
                    }}
                  />
                </div>
              )}
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
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    上传中...
                  </span>
                ) : '⬆️ 上传视频'}
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
