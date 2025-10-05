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
  const [totalVideos, setTotalVideos] = useState(0)
  const [cacheStats, setCacheStats] = useState({ count: 0, memoryCount: 0, totalSize: 0 })
  const [gridLayout, setGridLayout] = useState<number>(() => {
    // 从 localStorage 读取保存的布局设置
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('videoGridLayout')
      return saved ? parseInt(saved) : 4
    }
    return 4
  }) // 每行显示的列数
  const [actualCols, setActualCols] = useState<number>(4) // 实际显示的列数

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // 响应式布局处理
  useEffect(() => {
    const updateCols = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 640) {
          setActualCols(1) // 手机：1列
        } else if (window.innerWidth < 768) {
          setActualCols(Math.min(2, gridLayout)) // 小平板：最多2列
        } else if (window.innerWidth < 1024) {
          setActualCols(Math.min(3, gridLayout)) // 平板：最多3列
        } else {
          setActualCols(gridLayout) // 桌面：用户选择
        }
      }
    }
    
    updateCols()
    window.addEventListener('resize', updateCols)
    return () => window.removeEventListener('resize', updateCols)
  }, [gridLayout])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchVideos()
    }
  }, [status, page, gridLayout])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const limit = gridLayout * 3 // 根据列数计算每页显示数量（3行）
      const response = await axios.get(`/api/videos?page=${page}&limit=${limit}`)
      setVideos(response.data.videos)
      setTotalPages(response.data.pagination.totalPages)
      setTotalVideos(response.data.pagination.total)
      
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


  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-6 text-white text-lg font-medium">✨ 加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-10" style={{ maxWidth: '100%' }}>
        {/* 页面标题 */}
        <div className="mb-4 sm:mb-6 md:mb-10">
          <div className="glass-effect rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-8 shadow-xl">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-4xl font-bold gradient-text mb-2 sm:mb-3">🎬 视频库</h1>
                <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm">
                  <span 
                    className="inline-flex items-center px-2 sm:px-3 py-1 text-blue-700 rounded-full font-medium whitespace-nowrap"
                    style={{
                      background: 'linear-gradient(to right, #dbeafe, #bfdbfe)'
                    }}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                    共 {totalVideos} 个视频
                  </span>
                  
                  {/* 缓存统计 */}
                  {cacheStats.count > 0 && (
                    <span 
                      className="inline-flex items-center px-2 sm:px-3 py-1 text-green-700 rounded-full font-medium animate-pulse whitespace-nowrap"
                      style={{
                        background: 'linear-gradient(to right, #d1fae5, #a7f3d0)'
                      }}
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="hidden xs:inline">已缓存 </span>{cacheStats.count}<span className="hidden xs:inline"> 个封面</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 布局选择器 - 桌面端显示 */}
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm text-gray-600 font-medium">布局:</span>
                <div className="flex items-center space-x-1 bg-white rounded-lg p-1 shadow-md">
                  {[2, 3, 4, 5, 6].map((cols) => (
                    <button
                      key={cols}
                      onClick={() => {
                        setGridLayout(cols)
                        setPage(1)
                        // 保存到 localStorage
                        localStorage.setItem('videoGridLayout', cols.toString())
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        gridLayout === cols
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {cols}列
                    </button>
                  ))}
                </div>
              </div>

              {/* 布局选择器 - 移动端显示（精简版） */}
              <div className="flex md:hidden items-center space-x-2 overflow-x-auto pb-1">
                <span className="text-xs text-gray-600 font-medium whitespace-nowrap">布局:</span>
                <div className="flex items-center space-x-1 bg-white rounded-lg p-0.5 shadow-md">
                  {[2, 3, 4, 5].map((cols) => (
                    <button
                      key={cols}
                      onClick={() => {
                        setGridLayout(cols)
                        setPage(1)
                        // 保存到 localStorage
                        localStorage.setItem('videoGridLayout', cols.toString())
                      }}
                      className={`px-2 py-1 rounded text-xs font-bold transition-all whitespace-nowrap ${
                        gridLayout === cols
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {cols}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 视频内容 */}
        {videos.length === 0 ? (
          <div className="glass-effect rounded-xl sm:rounded-2xl p-8 sm:p-12 md:p-16 text-center shadow-xl">
            <div className="max-w-md mx-auto">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{
                  background: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)'
                }}
              >
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">暂无视频</h3>
              <p className="text-gray-600 mb-6">开始上传您的第一个视频吧！</p>
              <button
                onClick={() => router.push('/videos/upload')}
                className="px-8 py-4 rounded-xl transition-all shadow-xl font-black text-lg hover:scale-110 active:scale-95"
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
                ⬆️ 上传视频
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 视频网格 */}
            <div 
              className="grid gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-10 w-full"
              style={{
                gridTemplateColumns: `repeat(${actualCols}, minmax(0, 1fr))`,
                gridAutoRows: '1fr'
              }}
            >
              {videos.map((video) => (
                <VideoCardWithThumbnail
                  key={video.id}
                  {...video}
                  autoExtract={true}
                />
              ))}
            </div>

            {/* 分页器 */}
            {totalPages > 1 && (
              <div className="glass-effect rounded-xl sm:rounded-2xl p-2 sm:p-4 md:p-6 shadow-lg">
                <div className="flex justify-center items-center flex-wrap gap-1.5 sm:gap-2">
                  {/* 上一页按钮 */}
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-2 sm:px-4 py-2 bg-white border-2 border-blue-400 text-black font-bold rounded-lg hover:bg-blue-50 hover:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:hover:scale-100 text-xs sm:text-base"
                  >
                    <span className="hidden sm:inline">← 上一页</span>
                    <span className="sm:hidden">←</span>
                  </button>

                  {/* 页码按钮 */}
                  {(() => {
                    const pageNumbers = [];
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                    const maxVisiblePages = isMobile ? 5 : 7; // 手机显示5个，桌面显示7个
                    
                    if (totalPages <= maxVisiblePages) {
                      // 总页数少，显示全部页码
                      for (let i = 1; i <= totalPages; i++) {
                        pageNumbers.push(i);
                      }
                    } else {
                      // 总页数多，智能显示页码
                      if (page <= 4) {
                        // 当前页在前面
                        for (let i = 1; i <= 5; i++) pageNumbers.push(i);
                        pageNumbers.push('...');
                        pageNumbers.push(totalPages);
                      } else if (page >= totalPages - 3) {
                        // 当前页在后面
                        pageNumbers.push(1);
                        pageNumbers.push('...');
                        for (let i = totalPages - 4; i <= totalPages; i++) pageNumbers.push(i);
                      } else {
                        // 当前页在中间
                        pageNumbers.push(1);
                        pageNumbers.push(page - 2);
                        for (let i = page - 1; i <= page + 1; i++) pageNumbers.push(i);
                        pageNumbers.push('...');
                        pageNumbers.push(totalPages);
                      }
                    }

                    return pageNumbers.map((num, idx) => {
                      if (num === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-1 sm:px-3 py-2 text-gray-500 font-bold text-xs sm:text-base">
                            •••
                          </span>
                        );
                      }

                      const isActive = num === page;
                      return (
                        <button
                          key={num}
                          onClick={() => setPage(num as number)}
                          className={`min-w-[36px] sm:min-w-[44px] px-2 sm:px-4 py-2 font-black rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-110 active:scale-95 text-xs sm:text-base ${
                            isActive 
                              ? '' 
                              : 'bg-white border-2 border-blue-300 text-black hover:bg-blue-50 hover:border-blue-500'
                          }`}
                          style={isActive ? {
                            background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                            color: '#ffffff',
                            border: '2px solid rgba(59, 130, 246, 0.5)',
                            transform: 'scale(1.1)'
                          } : undefined}
                        >
                          {num}
                        </button>
                      );
                    });
                  })()}

                  {/* 下一页按钮 */}
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-2 sm:px-4 py-2 bg-white border-2 border-blue-400 text-black font-bold rounded-lg hover:bg-blue-50 hover:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:hover:scale-100 text-xs sm:text-base"
                  >
                    <span className="hidden sm:inline">下一页 →</span>
                    <span className="sm:hidden">→</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
