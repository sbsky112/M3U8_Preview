'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import VideoCardWithThumbnail from '@/components/VideoCardWithThumbnail'
import Navbar from '@/components/Navbar'
import { getCacheStats } from '@/lib/thumbnail-cache'
import { useVideoSearch } from '@/hooks/useVideoSearch'
import { VideoFilters } from '@/types/video'
import axios from 'axios'

<<<<<<< HEAD
function VideosPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const urlSearchParams = useSearchParams()
=======
export default function VideosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
>>>>>>> e870b7db83a6e17f15b9cd29ae3f6b5cd8f40694

  // 布局状态
  const [gridLayout, setGridLayout] = useState<number>(() => {
    // 从 localStorage 读取保存的布局设置
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('videoGridLayout')
      return saved ? parseInt(saved) : 4
    }
    return 4
  }) // 每行显示的列数
  const [actualCols, setActualCols] = useState<number>(4) // 实际显示的列数
  const [cacheStats, setCacheStats] = useState({ count: 0, memoryCount: 0, totalSize: 0 })

  // 筛选器选项
  const [filters, setFilters] = useState<VideoFilters>({ categories: [], authors: [] })
  const [showFilters, setShowFilters] = useState(false)

  // 搜索关键词（本地状态，不立即应用）
  const [searchKeyword, setSearchKeyword] = useState('')

<<<<<<< HEAD
  // 保存视频列表状态到localStorage
  const saveStateToLocalStorage = (state: any) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('videoListState', JSON.stringify(state))
      } catch (error) {
        console.warn('Failed to save video list state:', error)
      }
    }
  }

=======
>>>>>>> e870b7db83a6e17f15b9cd29ae3f6b5cd8f40694
  // 使用搜索 hook
  const {
    videos,
    loading,
    searchLoading,
    page,
    totalPages,
    totalVideos,
    searchParams,
    setSearchParams,
    applySearch,
    clearFilters,
    goToPage,
    searchVideos,
  } = useVideoSearch(gridLayout * 3) // 根据列数计算每页显示数量

<<<<<<< HEAD
  // 从URL参数初始化搜索状态 - 优先级最高
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    console.log('URL参数初始化useEffect触发')
    console.log('loading状态:', loading)
    console.log('URL参数:', Object.fromEntries(urlSearchParams.entries()))
    console.log('initialized状态:', initialized)

    // 避免重复初始化
    if (initialized) {
      console.log('已经初始化过，跳过')
      return
    }

    const urlPage = urlSearchParams.get('page')
    const urlSearch = urlSearchParams.get('search')
    const urlExactMatch = urlSearchParams.get('exactMatch') === 'true'
    const urlCategory = urlSearchParams.get('category')
    const urlAuthor = urlSearchParams.get('author')
    const urlStartDate = urlSearchParams.get('startDate')
    const urlEndDate = urlSearchParams.get('endDate')

    // 检查是否有URL参数需要同步到hook状态
    const hasUrlParams = urlPage || urlSearch || urlExactMatch || urlCategory || urlAuthor || urlStartDate || urlEndDate

    if (hasUrlParams) {
      const newParams = {
        page: urlPage ? parseInt(urlPage) : 1,
        search: urlSearch || '',
        exactMatch: urlExactMatch,
        category: urlCategory || '',
        author: urlAuthor || '',
        startDate: urlStartDate || '',
        endDate: urlEndDate || '',
        limit: gridLayout * 3,
      }

      console.log('检测到URL参数，设置搜索状态:', newParams)

      // 更新搜索关键词的本地状态
      if (urlSearch) {
        setSearchKeyword(urlSearch)
      }

      // 标记为已初始化
      setInitialized(true)

      // 延迟执行搜索，确保hook完全初始化
      setTimeout(() => {
        console.log('延迟执行搜索，参数:', newParams)
        searchVideos(newParams, true) // 强制刷新，不使用缓存
      }, 300)
    } else {
      console.log('没有URL参数，执行默认搜索')
      setInitialized(true)
      setTimeout(() => {
        searchVideos()
      }, 300)
    }
  }, [urlSearchParams, gridLayout, searchVideos, setSearchKeyword, initialized]) // 移除loading依赖

  // 使用URL导航的分页函数
  const navigateToPage = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return

    // 首先更新内部状态
    await goToPage(newPage)

    // 然后更新URL以保持同步
    const params = new URLSearchParams()

    if (newPage > 1) {
      params.append('page', newPage.toString())
    }
    if (searchParams.search) {
      params.append('search', searchParams.search)
    }
    if (searchParams.exactMatch) {
      params.append('exactMatch', 'true')
    }
    if (searchParams.category) {
      params.append('category', searchParams.category)
    }
    if (searchParams.author) {
      params.append('author', searchParams.author)
    }
    if (searchParams.startDate) {
      params.append('startDate', searchParams.startDate)
    }
    if (searchParams.endDate) {
      params.append('endDate', searchParams.endDate)
    }

    const newUrl = params.toString() ? `/videos?${params.toString()}` : '/videos'
    router.push(newUrl)
  }

  // 使用URL导航的搜索函数
  const navigateWithSearch = async (searchKeyword?: string) => {
    // 首先更新内部状态
    await applySearch(searchKeyword)

    // 然后更新URL以保持同步
    const params = new URLSearchParams()

    if (searchKeyword) {
      params.append('search', searchKeyword)
    }
    if (searchParams.exactMatch) {
      params.append('exactMatch', 'true')
    }
    if (searchParams.category) {
      params.append('category', searchParams.category)
    }
    if (searchParams.author) {
      params.append('author', searchParams.author)
    }
    if (searchParams.startDate) {
      params.append('startDate', searchParams.startDate)
    }
    if (searchParams.endDate) {
      params.append('endDate', searchParams.endDate)
    }
    if (searchParams.page && searchParams.page > 1) {
      params.append('page', searchParams.page.toString())
    }

    const newUrl = params.toString() ? `/videos?${params.toString()}` : '/videos'
    router.push(newUrl)
  }

  // 清除筛选条件的URL导航函数
  const navigateWithClearFilters = async () => {
    // 首先更新内部状态
    await clearFilters()

    // 然后更新URL以保持同步
    const params = new URLSearchParams()

    if (searchParams.search) {
      params.append('search', searchParams.search)
    }
    if (searchParams.exactMatch) {
      params.append('exactMatch', 'true')
    }

    const newUrl = params.toString() ? `/videos?${params.toString()}` : '/videos'
    router.push(newUrl)
  }

=======
>>>>>>> e870b7db83a6e17f15b9cd29ae3f6b5cd8f40694
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

  // 初始数据加载和布局变化时更新搜索限制
  useEffect(() => {
    if (status === 'authenticated') {
      setSearchParams({ limit: gridLayout * 3 })
    }
  }, [gridLayout, status, setSearchParams])

  // 获取筛选器选项
  useEffect(() => {
    if (status === 'authenticated') {
      fetchFilters()
    }
  }, [status])

<<<<<<< HEAD
  // 从URL参数恢复搜索状态
  useEffect(() => {
    if (status === 'authenticated') {
      const urlParams: any = {}

      // 从URL参数中提取搜索条件
      const page = urlSearchParams.get('page')
      const search = urlSearchParams.get('search')
      const exactMatch = urlSearchParams.get('exactMatch')
      const category = urlSearchParams.get('category')
      const author = urlSearchParams.get('author')
      const startDate = urlSearchParams.get('startDate')
      const endDate = urlSearchParams.get('endDate')

      if (page) urlParams.page = parseInt(page)
      if (search) urlParams.search = search
      if (exactMatch === 'true') urlParams.exactMatch = true
      if (category) urlParams.category = category
      if (author) urlParams.author = author
      if (startDate) urlParams.startDate = startDate
      if (endDate) urlParams.endDate = endDate

      // 设置搜索参数（优先使用URL参数）
      console.log('从URL恢复搜索状态:', urlParams)
      setSearchParams(urlParams)
    }
  }, [status, urlSearchParams, setSearchParams])

// 调试URL参数变化
useEffect(() => {
  if (searchParams) {
    console.log('当前searchParams:', searchParams)
    console.log('当前URL:', window.location.pathname + window.location.search)
  }
}, [searchParams])

  // 保存当前视频列表状态
  useEffect(() => {
    if (status === 'authenticated' && searchParams) {
      saveStateToLocalStorage({
        page: searchParams.page || 1,
        search: searchParams.search,
        exactMatch: searchParams.exactMatch,
        category: searchParams.category,
        author: searchParams.author,
        startDate: searchParams.startDate,
        endDate: searchParams.endDate,
      })
    }
  }, [searchParams, status])
=======
  // 确保认证成功后触发初始搜索
  useEffect(() => {
    if (status === 'authenticated' && videos.length === 0 && !loading) {
      // 延迟一下确保所有状态都已更新
      const timer = setTimeout(() => {
        searchVideos()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [status, videos.length, loading, searchVideos])
>>>>>>> e870b7db83a6e17f15b9cd29ae3f6b5cd8f40694

  // 更新缓存统计
  useEffect(() => {
    updateCacheStats()
  }, [videos])

  const fetchFilters = async () => {
    try {
      const response = await axios.get<VideoFilters>('/api/videos/filters')
      setFilters(response.data)
    } catch (error) {
      console.error('获取筛选器选项失败:', error)
    }
  }

  const handleSearch = async () => {
<<<<<<< HEAD
    navigateWithSearch(searchKeyword)
=======
    await applySearch(searchKeyword)
>>>>>>> e870b7db83a6e17f15b9cd29ae3f6b5cd8f40694
  }

  const handleClearFilters = async () => {
    setSearchKeyword('')
<<<<<<< HEAD
    navigateWithClearFilters()
  }

  // 更新筛选条件并导航
  const updateFilter = (key: string, value: any) => {
    const newParams = { ...searchParams, [key]: value }
    setSearchParams(newParams)

    // 构建新的URL参数
    const params = new URLSearchParams()

    if (newParams.page && newParams.page > 1) {
      params.append('page', newParams.page.toString())
    }
    if (newParams.search) {
      params.append('search', newParams.search)
    }
    if (newParams.exactMatch) {
      params.append('exactMatch', 'true')
    }
    if (newParams.category) {
      params.append('category', newParams.category)
    }
    if (newParams.author) {
      params.append('author', newParams.author)
    }
    if (newParams.startDate) {
      params.append('startDate', newParams.startDate)
    }
    if (newParams.endDate) {
      params.append('endDate', newParams.endDate)
    }

    const newUrl = params.toString() ? `/videos?${params.toString()}` : '/videos'
    router.push(newUrl)
=======
    await clearFilters()
  }

  // 更新筛选条件
  const updateFilter = (key: string, value: any) => {
    setSearchParams({ [key]: value })
>>>>>>> e870b7db83a6e17f15b9cd29ae3f6b5cd8f40694
  }

  const updateCacheStats = () => {
    try {
      const stats = getCacheStats()
      setCacheStats(stats)
    } catch (error) {
      console.error('获取缓存统计失败:', error)
    }
  }


  if (status === 'loading') {
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
    <div className="min-h-screen page-transition">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-10" style={{ maxWidth: '100%' }}>
        {/* 页面标题 */}
        <div className="mb-4 sm:mb-6 md:mb-10 animate-fade-in">
          <div className="glass-effect rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-8 shadow-xl card-hover">
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
                        setSearchParams({ page: 1, limit: cols * 3 })
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
                        setSearchParams({ page: 1, limit: cols * 3 })
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

        {/* 搜索和筛选区域 */}
        <div className="mb-6">
          {/* 标题栏 - 始终显示 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-900">搜索与筛选</h3>
                <p className="text-xs text-blue-600">快速找到您想要的视频</p>
              </div>
            </div>
            
            {/* 折叠/展开按钮 */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              <span className="text-sm font-bold hidden sm:inline">
                {showFilters ? '隐藏筛选' : '显示筛选'}
              </span>
              <svg 
                className={`w-5 h-5 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* 筛选内容区 */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showFilters ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="relative overflow-hidden rounded-2xl shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(239,246,255,0.98) 100%)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(59,130,246,0.2)'
              }}
            >
              {/* 装饰性背景 */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/40 to-blue-200/30 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-50/40 to-blue-100/30 rounded-full blur-3xl -z-10" />
              
              <div className="relative p-5 sm:p-7">
                {/* 悬浮加载指示器 */}
                {searchLoading && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                      <div className="w-3 h-3 mr-1 border border-white border-t-transparent rounded-full animate-spin"></div>
                      加载中...
                    </div>
                  </div>
                )}

              {/* 搜索框 */}
              <div className="mb-5">
                <div className="flex gap-3">
                  <div className="flex-1 relative group">
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="输入标题关键词..."
                      className="w-full px-4 py-3 pl-11 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm font-medium shadow-sm hover:shadow-md group-hover:border-gray-300"
                    />
                    <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={searchLoading}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all text-sm font-bold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-nowrap disabled:transform-none flex items-center"
                  >
                    {searchLoading ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="hidden sm:inline">搜索中...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">🔍 搜索</span>
                        <span className="sm:hidden">🔍</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* 精确搜索选项 */}
                <div className="mt-3 flex items-center">
                  <label className="flex items-center cursor-pointer group px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={searchParams.exactMatch || false}
                        onChange={(e) => updateFilter('exactMatch', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
                      />
                    </div>
                    <span className="ml-2.5 text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                      ⚡ 精确搜索（完全匹配标题）
                    </span>
                  </label>
                </div>
              </div>

              {/* 分隔线 */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-blue-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 py-1.5 bg-blue-500 text-xs font-bold text-white rounded-full shadow-md">
                    高级筛选
                  </span>
                </div>
              </div>

              {/* 筛选器 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 分类筛选 */}
                <div className="group">
                  <label className="flex items-center text-xs font-bold text-blue-900 mb-2">
                    <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    视频分类
                  </label>
                  <div className="relative">
                    <select
                      value={searchParams.category || ''}
                      onChange={(e) => updateFilter('category', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm font-medium shadow-sm hover:shadow-md hover:border-blue-300 appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="">🎬 全部分类</option>
                      {filters.categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 作者筛选 */}
                <div className="group">
                  <label className="flex items-center text-xs font-bold text-blue-900 mb-2">
                    <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    视频作者
                  </label>
                  <div className="relative">
                    <select
                      value={searchParams.author || ''}
                      onChange={(e) => updateFilter('author', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm font-medium shadow-sm hover:shadow-md hover:border-blue-300 appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="">👤 全部作者</option>
                      {filters.authors.map((author) => (
                        <option key={author} value={author}>
                          {author}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 开始日期 */}
                <div className="group">
                  <label className="flex items-center text-xs font-bold text-blue-900 mb-2">
                    <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={searchParams.startDate || ''}
                    onChange={(e) => updateFilter('startDate', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm font-medium shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer"
                  />
                </div>

                {/* 结束日期 */}
                <div className="group">
                  <label className="flex items-center text-xs font-bold text-blue-900 mb-2">
                    <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={searchParams.endDate || ''}
                    onChange={(e) => updateFilter('endDate', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm font-medium shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer"
                  />
                </div>
              </div>

              {/* 应用筛选按钮和提示 */}
              <div className="mt-4 text-center">
                <p className="text-xs text-blue-600 font-medium mb-3">💡 选择筛选条件后，请点击应用筛选按钮</p>
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all text-sm font-bold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center mx-auto"
                >
                  {searchLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      应用中...
                    </>
                  ) : (
                    <>
                      ✨ 应用筛选
                    </>
                  )}
                </button>
              </div>

              {/* 活动筛选条件显示和清空按钮 */}
              {(searchParams.search || searchParams.exactMatch || searchParams.category || searchParams.author || searchParams.startDate || searchParams.endDate) && (
                <div className="mt-5 pt-5 border-t-2 border-blue-200">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-blue-900">当前筛选：</span>

                    {searchParams.search && (
                      <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchParams.search}
                        {searchParams.exactMatch && <span className="ml-1">⚡</span>}
                      </span>
                    )}

                    {searchParams.category && (
                      <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {searchParams.category}
                      </span>
                    )}

                    {searchParams.author && (
                      <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {searchParams.author}
                      </span>
                    )}

                    {(searchParams.startDate || searchParams.endDate) && (
                      <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {searchParams.startDate || '...'} ~ {searchParams.endDate || '...'}
                      </span>
                    )}
                    
                    <button
                      onClick={handleClearFilters}
                      disabled={searchLoading}
                      className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-xs font-bold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {searchLoading ? '清空中...' : '清空全部'}
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>

        {/* 视频内容 */}
        {videos.length === 0 ? (
          <div className="glass-effect rounded-xl sm:rounded-2xl p-8 sm:p-12 md:p-16 text-center shadow-xl animate-scale-in">
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
              {videos.map((video, index) => (
                <div
                  key={video.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <VideoCardWithThumbnail
                    {...video}
                    autoExtract={true}
                    searchParams={searchParams}
                  />
                </div>
              ))}
            </div>

            {/* 分页器 */}
            {totalPages > 1 && (
              <div className="glass-effect rounded-xl sm:rounded-2xl p-2 sm:p-4 md:p-6 shadow-lg">
                <div className="flex justify-center items-center flex-wrap gap-1.5 sm:gap-2">
                  {/* 上一页按钮 */}
                  <button
<<<<<<< HEAD
                    onClick={() => navigateToPage(page - 1)}
=======
                    onClick={() => goToPage(page - 1)}
>>>>>>> e870b7db83a6e17f15b9cd29ae3f6b5cd8f40694
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
<<<<<<< HEAD
                          onClick={() => navigateToPage(num as number)}
=======
                          onClick={() => goToPage(num as number)}
>>>>>>> e870b7db83a6e17f15b9cd29ae3f6b5cd8f40694
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
<<<<<<< HEAD
                    onClick={() => navigateToPage(page + 1)}
=======
                    onClick={() => goToPage(page + 1)}
>>>>>>> e870b7db83a6e17f15b9cd29ae3f6b5cd8f40694
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

// 默认导出，用Suspense包装
export default function VideosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <VideosPageContent />
    </Suspense>
  )
}
