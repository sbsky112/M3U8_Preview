'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface VideoCardProps {
  id: string
  title: string
  description?: string
  thumbnail?: string
  createdAt: string
  user: {
    name: string | null
    username: string
  }
  onDelete?: (id: string) => void
}

export default function VideoCard({
  id,
  title,
  description,
  thumbnail,
  createdAt,
  user,
  onDelete,
}: VideoCardProps) {
  const defaultThumbnail = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect width="400" height="225" fill="%23e2e8f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="%2364748b"%3E视频封面%3C/text%3E%3C/svg%3E'

  return (
    <div className="video-card bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 w-full h-full flex flex-col">
      <Link href={`/videos/${id}`}>
        <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden group">
          <img
            src={thumbnail || defaultThumbnail}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* 播放按钮 */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 bg-white/95 rounded-full flex items-center justify-center backdrop-blur-sm shadow-2xl transform group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
      
      <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col">
        <Link href={`/videos/${id}`}>
          <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-1 sm:mb-2">
            {title}
          </h3>
        </Link>
        
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
