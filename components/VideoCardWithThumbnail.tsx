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
  user: {
    name: string | null
    email: string
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
    <div className="video-card bg-white rounded-lg shadow-md overflow-hidden">
      <Link href={`/videos/${id}`}>
        <div className="relative aspect-video bg-gray-200">
          <img
            src={thumbnail || defaultThumbnail}
            alt={title}
            className={`w-full h-full object-cover transition-opacity ${
              isExtracting ? 'opacity-50' : 'opacity-100'
            }`}
          />
          
          {/* 提取中的加载动画 */}
          {isExtracting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                <p className="text-white text-xs mt-2">提取封面中...</p>
              </div>
            </div>
          )}

          {/* 提取失败的提示 */}
          {extractError && !thumbnail && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-red-500 bg-opacity-90 text-white text-xs px-2 py-1 rounded">
                封面提取失败
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity" />
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/videos/${id}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2">
            {title}
          </h3>
        </Link>
        
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{description}</p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="truncate">{user.name || user.email}</span>
          <span className="whitespace-nowrap ml-2">
            {format(new Date(createdAt), 'yyyy-MM-dd HH:mm', {
              locale: zhCN,
            })}
          </span>
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="mt-3 w-full bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            删除视频
          </button>
        )}
      </div>
    </div>
  )
}
