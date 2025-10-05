'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import VideoCardWithThumbnail from '@/components/VideoCardWithThumbnail'
import Navbar from '@/components/Navbar'
import { getCacheStats } from '@/lib/thumbnail-cache'

interface Video {
  id: string
  title: string
  description?: string
  m3u8Url: string
  thumbnail?: string
  createdAt: string
  user: {
    id: string
    name: string | null
    username: string
  }
}

export default function VideosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [cacheStats, setCacheStats] = useState({ count: 0, memoryCount: 0, totalSize: 0 })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchVideos()
    }
  }, [status, page])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/videos?page=${page}&limit=12`)
      setVideos(response.data.videos)
      setTotalPages(response.data.pagination.totalPages)
      
      // 更新缓存统计
      updateCacheStats()
    } catch (error) {
      console.error('获取视频列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCacheStats = () => {
    try {
      const stats = getCacheStats()
      setCacheStats(stats)
    } catch (error) {
      console.error('获取缓存统计失败:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个视频吗？')) {
      return
    }

    try {
      await axios.delete(`/api/videos/${id}`)
      fetchVideos()
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">视频列表</h1>
              <p className="mt-2 text-gray-600">
                共 {videos.length} 个视频
              </p>
            </div>
            
            {/* 缓存统计信息 */}
            {cacheStats.count > 0 && (
              <div className="text-right">
                <div className="inline-flex items-center px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
                  <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-700">
                    已缓存 {cacheStats.count} 个封面
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">暂无视频</p>
            <button
              onClick={() => router.push('/videos/upload')}
              className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              上传第一个视频
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCardWithThumbnail
                  key={video.id}
                  {...video}
                  autoExtract={true}
                  onDelete={
                    video.user.id === (session?.user as any)?.id
                      ? handleDelete
                      : undefined
                  }
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="px-4 py-2 text-gray-700">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
