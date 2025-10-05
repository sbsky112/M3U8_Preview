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
    email: string
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
    <div className="video-card bg-white rounded-lg shadow-md overflow-hidden">
      <Link href={`/videos/${id}`}>
        <div className="relative aspect-video bg-gray-200">
          <img
            src={thumbnail || defaultThumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
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
          <span>{user.name || user.email}</span>
          <span>
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
