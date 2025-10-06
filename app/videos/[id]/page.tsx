'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import VideoPlayer from '@/components/VideoPlayer'
import Navbar from '@/components/Navbar'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Video {
  id: string
  title: string
  description?: string
  m3u8Url: string
  thumbnail?: string
  duration?: number
  author?: string
  category?: string
  createdAt: string
  user: {
    id: string
    name: string | null
    username: string
  }
}

export default function VideoDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  // 构建返回URL
  const buildReturnUrl = () => {
    // 从document.referrer获取来源URL的查询参数
    let returnPage = 1
    let returnSearch = ''
    let returnExactMatch = false
    let returnCategory = ''
    let returnAuthor = ''
    let returnStartDate = ''
    let returnEndDate = ''

    if (typeof window !== 'undefined') {
      try {
        // 尝试从URL查询参数中获取
        const urlParams = new URLSearchParams(window.location.search)
        returnPage = parseInt(urlParams.get('page') || '1')
        returnSearch = urlParams.get('search') || ''
        returnExactMatch = urlParams.get('exactMatch') === 'true'
        returnCategory = urlParams.get('category') || ''
        returnAuthor = urlParams.get('author') || ''
        returnStartDate = urlParams.get('startDate') || ''
        returnEndDate = urlParams.get('endDate') || ''

        console.log('从URL查询参数获取返回信息:', {
          page: returnPage,
          search: returnSearch,
          exactMatch: returnExactMatch,
          category: returnCategory,
          author: returnAuthor,
          startDate: returnStartDate,
          endDate: returnEndDate
        })
      } catch (error) {
        console.warn('Failed to parse URL params:', error)
      }
    }

    // 优先使用URL参数，其次使用localStorage
    const params = new URLSearchParams()

    if (returnPage > 1) {
      params.append('page', returnPage.toString())
    }
    if (returnSearch) {
      params.append('search', returnSearch)
    }
    if (returnExactMatch) {
      params.append('exactMatch', 'true')
    }
    if (returnCategory) {
      params.append('category', returnCategory)
    }
    if (returnAuthor) {
      params.append('author', returnAuthor)
    }
    if (returnStartDate) {
      params.append('startDate', returnStartDate)
    }
    if (returnEndDate) {
      params.append('endDate', returnEndDate)
    }

    const queryString = params.toString()
    const returnUrl = queryString ? `/videos?${queryString}` : '/videos'
    console.log('构建的返回URL:', returnUrl)
    return returnUrl
  }
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && params.id) {
      const abortController = new AbortController()
      fetchVideo(abortController.signal)

      // 清理函数：取消未完成的请求
      return () => {
        abortController.abort()
      }
    }
  }, [status, params.id])

  const fetchVideo = async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/videos/${params.id}`, {
        signal
      })
      setVideo(response.data)
    } catch (error: any) {
      // 忽略被取消的请求
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log('请求已取消')
        return
      }
      console.error('获取视频详情失败:', error)
      alert('视频不存在或已被删除')
      router.push('/videos')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个视频吗？')) {
      return
    }

    try {
      await axios.delete(`/api/videos/${params.id}`)
      alert('删除成功')
      router.push(buildReturnUrl())
    } catch (error: any) {
      alert(error.response?.data?.error || '删除失败')
    }
  }

  if (status === 'loading' || loading) {
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

  if (!video) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 md:p-6">
          {/* 返回按钮 */}
          <div className="mb-4 sm:mb-5 md:mb-6">
            <button
              onClick={() => router.push(buildReturnUrl())}
              className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all font-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-sm sm:text-base"
              style={{
                background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                color: '#ffffff',
                border: '2px solid rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #1d4ed8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #3b82f6, #2563eb)';
              }}
            >
              ← 返回视频列表
            </button>
          </div>

          <VideoPlayer
            url={video.m3u8Url}
            title={video.title}
            thumbnail={video.thumbnail}
          />

          <div className="mt-4 sm:mt-5 md:mt-6">
            {/* 标题 */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              {video.title}
            </h1>

            {/* 作者和分类标签 */}
            {(video.author || video.category) && (
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                {video.author && (
                  <span className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs sm:text-sm font-medium border border-purple-200">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {video.author}
                  </span>
                )}
                {video.category && (
                  <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm font-medium border border-blue-200">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {video.category}
                  </span>
                )}
              </div>
            )}

            {/* 描述 */}
            {video.description && (
              <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 leading-relaxed">{video.description}</p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t pt-3 sm:pt-4 gap-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  上传者: <span className="font-medium">{video.user.name || video.user.username}</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  上传时间: {format(new Date(video.createdAt), 'yyyy-MM-dd HH:mm:ss', {
                    locale: zhCN,
                  })}
                </p>
              </div>

              {video.user.id === (session?.user as any)?.id && (
                <div className="flex space-x-2 sm:space-x-3">
                  <button
                    onClick={() => router.push(`/videos/${params.id}/edit`)}
                    className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all font-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-sm sm:text-base"
                    style={{
                      background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                      color: '#ffffff',
                      border: '2px solid rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #1d4ed8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #3b82f6, #2563eb)';
                    }}
                  >
                    ✏️ 编辑视频
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all font-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-sm sm:text-base"
                    style={{
                      background: 'linear-gradient(to right, #ef4444, #dc2626)',
                      color: '#ffffff',
                      border: '2px solid rgba(239, 68, 68, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #dc2626, #b91c1c)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #dc2626)';
                    }}
                  >
                    🗑️ 删除视频
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
