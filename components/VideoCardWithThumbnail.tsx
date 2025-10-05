'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { extractM3U8Thumbnail } from '@/lib/video-thumbnail'
import { getThumbnailFromCache, saveThumbnailToCache } from '@/lib/thumbnail-cache'

interface VideoCardWithThumbnailProps {
  id: string
  title: string
  description?: string
  m3u8Url: string
  thumbnail?: string
  createdAt: string
  author?: string | null
  category?: string | null
  user: {
    name: string | null
    username: string
  }
  onDelete?: (id: string) => void
  autoExtract?: boolean // 是否自动提取封面
}

export default function VideoCardWithThumbnail({
  id,
  title,
  description,
  m3u8Url,
  thumbnail: initialThumbnail,
  createdAt,
  author,
  category,
  user,
  onDelete,
  autoExtract = true,
}: VideoCardWithThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string>(initialThumbnail || '')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState(false)

  const defaultThumbnail = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect width="400" height="225" fill="%23e2e8f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="%2364748b"%3E视频封面%3C/text%3E%3C/svg%3E'

  useEffect(() => {
    // 如果已有封面，不需要提取
    if (initialThumbnail) {
      return
    }

    // 如果不自动提取，不处理
    if (!autoExtract) {
      return
    }

    // 尝试从缓存获取
    const cached = getThumbnailFromCache(id, m3u8Url)
    if (cached) {
      setThumbnail(cached)
      return
    }

    // 自动提取封面
    extractThumbnail()
  }, [id, m3u8Url, initialThumbnail, autoExtract])

  const extractThumbnail = async () => {
    if (isExtracting || extractError) return

    try {
      setIsExtracting(true)
      setExtractError(false)

      // 提取封面（使用优化参数）
      const extracted = await extractM3U8Thumbnail(m3u8Url, 0.5, {
        timeout: 10000, // 10秒超时
        quality: 0.6, // 降低质量
        maxWidth: 480, // 小尺寸
      })

      // 保存到缓存
      saveThumbnailToCache(id, m3u8Url, extracted)

      // 更新状态
      setThumbnail(extracted)
    } catch (error) {
      console.error(`提取视频 ${id} 封面失败:`, error)
      setExtractError(true)
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <div className="video-card card-hover bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 w-full h-full flex flex-col">
      <Link href={`/videos/${id}`}>
        <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden group">
          <img
            src={thumbnail || defaultThumbnail}
            alt={title}
            className={`w-full h-full object-cover transition-all duration-500 ${
              isExtracting ? 'opacity-50' : 'opacity-100'
            } group-hover:scale-110`}
          />
          
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* 播放按钮 */}
          {!isExtracting && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-16 h-16 bg-white/95 rounded-full flex items-center justify-center backdrop-blur-sm shadow-2xl transform group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
          )}
          
          {/* 提取中的加载动画 */}
          {isExtracting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white mx-auto"></div>
                <p className="text-white text-sm font-medium mt-3">✨ 提取封面中...</p>
              </div>
            </div>
          )}

          {/* 提取失败的提示 */}
          {extractError && !thumbnail && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-red-500/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg shadow-lg flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                封面提取失败
              </div>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col">
        <Link href={`/videos/${id}`}>
          <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-1 sm:mb-2">
            {title}
          </h3>
        </Link>
        
        {/* 作者和分类 */}
        {(author || category) && (
          <div className="flex items-center gap-2 mb-2">
            {author && (
              <span className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] sm:text-xs font-medium">
                <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {author}
              </span>
            )}
            {category && (
              <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] sm:text-xs font-medium">
                <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {category}
              </span>
            )}
          </div>
        )}
        
        {description && (
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 sm:mb-3 md:mb-4">{description}</p>
        )}
        
        <div className="flex items-center justify-between text-[10px] sm:text-xs mt-auto">
          <div className="flex items-center min-w-0 flex-1">
            <span className="text-gray-700 font-medium truncate">{user.name || user.username}</span>
          </div>
          <span className="text-gray-500 bg-blue-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs whitespace-nowrap ml-1 sm:ml-2">
            {format(new Date(createdAt), 'yyyy-MM-dd HH:mm:ss', {
              locale: zhCN,
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
