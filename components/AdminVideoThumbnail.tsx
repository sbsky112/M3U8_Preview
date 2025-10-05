'use client'

import { useState, useEffect } from 'react'
import { extractM3U8Thumbnail } from '@/lib/video-thumbnail'
import { getThumbnailFromCache, saveThumbnailToCache } from '@/lib/thumbnail-cache'

interface AdminVideoThumbnailProps {
  videoId: string
  m3u8Url: string
  initialThumbnail?: string
  title: string
}

export default function AdminVideoThumbnail({
  videoId,
  m3u8Url,
  initialThumbnail,
  title,
}: AdminVideoThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string>(initialThumbnail || '')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState(false)

  const defaultThumbnail = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect width="400" height="225" fill="%23e2e8f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="%2364748b"%3E视频封面%3C/text%3E%3C/svg%3E'

  useEffect(() => {
    // 如果已有封面，不需要提取
    if (initialThumbnail) {
      setThumbnail(initialThumbnail)
      return
    }

    // 尝试从缓存获取
    const cached = getThumbnailFromCache(videoId, m3u8Url)
    if (cached) {
      setThumbnail(cached)
      return
    }

    // 自动提取封面
    extractThumbnail()
  }, [videoId, m3u8Url, initialThumbnail])

  const extractThumbnail = async () => {
    if (isExtracting || extractError) return

    try {
      setIsExtracting(true)
      setExtractError(false)

      // 提取封面（使用优化参数，小尺寸快速加载）
      const extracted = await extractM3U8Thumbnail(m3u8Url, 0.5, {
        timeout: 8000, // 8秒超时
        quality: 0.5, // 较低质量，加快加载
        maxWidth: 320, // 小尺寸
      })

      // 保存到缓存
      saveThumbnailToCache(videoId, m3u8Url, extracted)

      // 更新状态
      setThumbnail(extracted)
    } catch (error) {
      console.error(`提取视频 ${videoId} 封面失败:`, error)
      setExtractError(true)
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <div className="relative w-24 h-14 bg-gray-100 rounded overflow-hidden">
      <img
        src={thumbnail || defaultThumbnail}
        alt={title}
        className="w-full h-full object-cover"
        onError={() => {
          if (!extractError) {
            setExtractError(true)
          }
        }}
      />
      
      {isExtracting && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {extractError && !isExtracting && !thumbnail && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  )
}
