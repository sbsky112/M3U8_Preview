'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Video } from '@/types/video'

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
  const searchVideos = useCallback(async (params?: Partial<VideoSearchParams>) => {
    try {
      setSearchLoading(true)
      const finalParams = params ? { ...searchParams, ...params } : searchParams

      console.log('执行搜索，参数:', finalParams)

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

  // 初始加载时自动搜索
  useEffect(() => {
    // 只在组件首次挂载时执行一次搜索
    const timer = setTimeout(() => {
      searchVideos()
    }, 100) // 短延迟确保组件完全加载

    return () => clearTimeout(timer)
  }, []) // 空依赖数组，只在首次挂载时执行

  // 自动搜索（仅当搜索关键词变化时）
  useEffect(() => {
    // 避免初始加载时的重复请求（当不是初始加载时）
    if (loading && videos.length === 0) return

    const timer = setTimeout(() => {
      searchVideos()
    }, 300) // 防抖 300ms

    return () => clearTimeout(timer)
  }, [searchParams.search]) // 只监控搜索关键词

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