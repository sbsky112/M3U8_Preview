'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Navbar from '@/components/Navbar'
import AdminVideoThumbnail from '@/components/AdminVideoThumbnail'
import { hasAdminAccess } from '@/lib/permissions'
import { format } from 'date-fns'

interface Video {
  id: string
  title: string
  description?: string
  m3u8Url: string
  thumbnail?: string
  author?: string
  category?: string
  createdAt: string
  user: {
    id: string
    name: string | null
    username: string
  }
}

export default function AdminVideosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVideos, setTotalVideos] = useState(0)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [authors, setAuthors] = useState<string[]>([])
  const [batchCategory, setBatchCategory] = useState('')
  const [showBatchActions, setShowBatchActions] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/videos')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchVideos()
      fetchFilters()
    }
  }, [status, session, page, searchKeyword, selectedCategory, selectedAuthor])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      
      if (searchKeyword) params.append('search', searchKeyword)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedAuthor) params.append('author', selectedAuthor)
      
      const response = await axios.get(`/api/videos?${params.toString()}`)
      setVideos(response.data.videos)
      setTotalPages(response.data.pagination.totalPages)
      setTotalVideos(response.data.pagination.total)
    } catch (error) {
      console.error('获取视频列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFilters = async () => {
    try {
      const response = await axios.get('/api/videos/filters')
      setCategories(response.data.categories)
      setAuthors(response.data.authors)
    } catch (error) {
      console.error('获取筛选器选项失败:', error)
    }
  }

  const handleSelectAll = () => {
    if (selectedVideos.size === videos.length) {
      setSelectedVideos(new Set())
    } else {
      setSelectedVideos(new Set(videos.map(v => v.id)))
    }
  }

  const handleSelectVideo = (id: string) => {
    const newSelected = new Set(selectedVideos)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedVideos(newSelected)
  }

  const handleBatchDelete = async () => {
    if (selectedVideos.size === 0) {
      alert('请先选择要删除的视频')
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedVideos.size} 个视频吗？此操作不可恢复！`)) {
      return
    }

    try {
      await axios.post('/api/admin/videos/batch-delete', {
        videoIds: Array.from(selectedVideos)
      })
      alert('批量删除成功')
      setSelectedVideos(new Set())
      fetchVideos()
    } catch (error: any) {
      alert(error.response?.data?.error || '批量删除失败')
    }
  }

  const handleBatchUpdateCategory = async () => {
    if (selectedVideos.size === 0) {
      alert('请先选择要修改的视频')
      return
    }

    if (!batchCategory) {
      alert('请选择要设置的分类')
      return
    }

    if (!confirm(`确定要将选中的 ${selectedVideos.size} 个视频的分类设置为"${batchCategory}"吗？`)) {
      return
    }

    try {
      await axios.post('/api/admin/videos/batch-update', {
        videoIds: Array.from(selectedVideos),
        category: batchCategory
      })
      alert('批量修改分类成功')
      setSelectedVideos(new Set())
      setBatchCategory('')
      fetchVideos()
    } catch (error: any) {
      alert(error.response?.data?.error || '批量修改失败')
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
        {/* 页面标题 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">视频批量管理</h1>
            <p className="mt-2 text-gray-600">
              共 {totalVideos} 个视频，已选择 {selectedVideos.size} 个
            </p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            ← 返回后台
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">搜索标题</label>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="输入关键词..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部分类</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">作者</label>
              <select
                value={selectedAuthor}
                onChange={(e) => {
                  setSelectedAuthor(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部作者</option>
                {authors.map((author) => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 批量操作栏 */}
        {selectedVideos.size > 0 && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-blue-900 font-medium">
                已选择 {selectedVideos.size} 个视频
              </span>
              
              <button
                onClick={() => setShowBatchActions(!showBatchActions)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                批量操作 {showBatchActions ? '▲' : '▼'}
              </button>

              {showBatchActions && (
                <>
                  <div className="flex items-center gap-2">
                    <select
                      value={batchCategory}
                      onChange={(e) => setBatchCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">选择分类</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleBatchUpdateCategory}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      修改分类
                    </button>
                  </div>

                  <button
                    onClick={handleBatchDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    批量删除
                  </button>

                  <button
                    onClick={() => setSelectedVideos(new Set())}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    取消选择
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* 视频列表 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedVideos.size === videos.length && videos.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    缩略图
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    上传者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    上传时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {videos.map((video) => (
                  <tr key={video.id} className={selectedVideos.has(video.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedVideos.has(video.id)}
                        onChange={() => handleSelectVideo(video.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <AdminVideoThumbnail
                        videoId={video.id}
                        m3u8Url={video.m3u8Url}
                        initialThumbnail={video.thumbnail}
                        title={video.title}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {video.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {video.author ? (
                        <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          {video.author}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">无</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {video.category ? (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {video.category}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">无</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {video.user.name || video.user.username}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(video.createdAt), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => router.push(`/videos/${video.id}`)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
