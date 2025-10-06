'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Video } from '@/types/video'
import { videoCache } from '@/lib/video-cache'

export interface VideoSearchParams {
  search?: string
  exactMatch?: boolean
  category?: string
  author?: string
  startDate?: string
  endDate?: string
  page: number
  limit: number
}

export interface VideoSearchResult {
  videos: Video[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  searchParams?: VideoSearchParams
}

export function useVideoSearch(initialLimit: number = 20) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVideos, setTotalVideos] = useState(0)
  const [lastSearchParams, setLastSearchParams] = useState<VideoSearchParams | null>(null)

  // 搜索参数状态
  const [searchParams, setSearchParams] = useState<VideoSearchParams>({
    page: 1,
    limit: initialLimit,
  })

  // 更新搜索参数的辅助函数
  const updateSearchParams = useCallback((updates: Partial<VideoSearchParams>) => {
    setSearchParams(prev => ({
      ...prev,
      ...updates,
      page: updates.page ?? 1, // 默认重置到第一页
    }))
  }, [])

  // 执行搜索的函数
  const searchVideos = useCallback(async (params?: Partial<VideoSearchParams>, forceRefresh = false) => {
    try {
      setSearchLoading(true)
      const finalParams = params ? { ...searchParams, ...params } : searchParams

      console.log('执行搜索，参数:', finalParams)
      console.log('搜索来源:', params ? '外部调用' : 'hook自动触发')

      // 生成缓存键
      const cacheKey = videoCache.generateKey(finalParams)

      // 尝试从缓存获取数据（除非强制刷新）
      if (!forceRefresh) {
        const cachedData = videoCache.get<VideoSearchResult>(cacheKey)
        if (cachedData) {
          console.log('从缓存获取数据')
          setVideos(cachedData.videos)
          setTotalPages(cachedData.pagination.totalPages)
          setTotalVideos(cachedData.pagination.total)
          setPage(cachedData.pagination.page)
          setLastSearchParams(cachedData.searchParams || finalParams)
          setSearchLoading(false)
          return cachedData
        }
      }

      // 构建查询参数
      const queryParams = new URLSearchParams()
      Object.entries(finalParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'boolean') {
            queryParams.append(key, value.toString())
          } else {
            queryParams.append(key, value.toString())
          }
        }
      })

      const response = await axios.get<VideoSearchResult>(`/api/videos?${queryParams.toString()}`)

      // 缓存结果
      videoCache.set(cacheKey, response.data, 2 * 60 * 1000) // 缓存2分钟

      setVideos(response.data.videos)
      setTotalPages(response.data.pagination.totalPages)
      setTotalVideos(response.data.pagination.total)
      setPage(response.data.pagination.page)
      setLastSearchParams(response.data.searchParams || finalParams)

      console.log('搜索结果:', {
        找到视频数量: response.data.videos.length,
        总数: response.data.pagination.total,
        当前页: response.data.pagination.page,
      })

      return response.data
    } catch (error) {
      console.error('搜索视频失败:', error)
      throw error
    } finally {
      setSearchLoading(false)
    }
  }, [searchParams])

  // 重置搜索参数
  const resetSearch = useCallback(() => {
    const newParams = {
      page: 1,
      limit: initialLimit,
    }
    setSearchParams(newParams)
    setPage(1)
    return newParams
  }, [initialLimit])

  // 清空所有筛选条件
  const clearFilters = useCallback(async () => {
    const newParams = resetSearch()
    await searchVideos(newParams)
  }, [resetSearch, searchVideos])

  // 应用搜索（从搜索框）
  const applySearch = useCallback(async (keyword?: string) => {
    const newParams = {
      ...searchParams,
      search: keyword,
      page: 1,
    }
    setSearchParams(newParams)
    await searchVideos(newParams)
  }, [searchParams, searchVideos])

  // 切换页码
  const goToPage = useCallback(async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return

    const newParams = {
      ...searchParams,
      page: newPage,
    }
    setSearchParams(newParams)
    await searchVideos(newParams)
  }, [searchParams, searchVideos, totalPages])

  // 初始加载时不自动搜索，等待外部参数初始化
  // useEffect(() => {
  //   // 在组件挂载后立即执行搜索，不等待任何条件
  //   const timer = setTimeout(() => {
  //     searchVideos()
  //   }, 100) // 短延迟确保组件完全加载

  //   return () => clearTimeout(timer)
  // }, []) // 空依赖数组，只在首次挂载时执行

  // 当搜索参数变化时自动搜索 - 禁用自动触发
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     searchVideos()
  //   }, 100) // 减少延迟以便更快响应

  //   return () => clearTimeout(timer)
  // }, [searchParams]) // 监控所有搜索参数

  return {
    // 数据状态
    videos,
    loading,
    searchLoading,
    page,
    totalPages,
    totalVideos,
    lastSearchParams,

    // 搜索参数
    searchParams,
    setSearchParams: updateSearchParams,

    // 操作方法
    searchVideos,
    applySearch,
    clearFilters,
    resetSearch,
    goToPage,
    setPage,
  }
}