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
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && params.id) {
      fetchVideo()
    }
  }, [status, params.id])

  const fetchVideo = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/videos/${params.id}`)
      setVideo(response.data)
    } catch (error) {
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
      router.push('/videos')
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
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <VideoPlayer
            url={video.m3u8Url}
            title={video.title}
            thumbnail={video.thumbnail}
          />

          <div className="mt-6">
            {video.description && (
              <p className="text-gray-700 mb-4">{video.description}</p>
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="text-sm text-gray-600">
                  上传者: <span className="font-medium">{video.user.name || video.user.username}</span>
                </p>
                <p className="text-sm text-gray-600">
                  上传时间: {format(new Date(video.createdAt), 'yyyy-MM-dd HH:mm:ss', {
                    locale: zhCN,
                  })}
                </p>
              </div>

              {video.user.id === (session?.user as any)?.id && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/videos/${params.id}/edit`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    编辑视频
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    删除视频
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => router.push('/videos')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← 返回视频列表
          </button>
        </div>
      </main>
    </div>
  )
}
