'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Navbar from '@/components/Navbar'
import ThumbnailExtractor from '@/components/ThumbnailExtractor'
import { hasAdminAccess } from '@/lib/permissions'

export default function UploadVideoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    m3u8Url: '',
    thumbnail: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && !hasAdminAccess(session?.user)) {
      alert('只有管理员可以上传视频')
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
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
      await axios.post('/api/videos', formData)
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
                placeholder="输入视频标题"
              />
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
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? '上传中...' : '上传视频'}
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
