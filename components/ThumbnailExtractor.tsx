'use client'

import { useState } from 'react'
import { extractM3U8Thumbnail } from '@/lib/video-thumbnail'

interface ThumbnailExtractorProps {
  m3u8Url: string
  onThumbnailExtracted: (dataUrl: string) => void
}

export default function ThumbnailExtractor({
  m3u8Url,
  onThumbnailExtracted,
}: ThumbnailExtractorProps) {
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const [seekTime, setSeekTime] = useState(1)

  const handleExtract = async () => {
    if (!m3u8Url) {
      setError('请先输入 M3U8 链接')
      return
    }

    try {
      setExtracting(true)
      setError('')

      const thumbnail = await extractM3U8Thumbnail(m3u8Url, seekTime)
      onThumbnailExtracted(thumbnail)
    } catch (error: any) {
      console.error('提取封面失败:', error)
      setError(error.message || '提取封面失败，请检查视频链接是否正确')
    } finally {
      setExtracting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <label htmlFor="seekTime" className="block text-sm text-gray-600 mb-1">
            提取时间点（秒）
          </label>
          <input
            id="seekTime"
            type="number"
            min="0"
            step="0.5"
            value={seekTime}
            onChange={(e) => setSeekTime(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1"
          />
        </div>
        <div className="pt-6">
          <button
            type="button"
            onClick={handleExtract}
            disabled={extracting || !m3u8Url}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {extracting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                提取中...
              </span>
            ) : (
              '提取封面'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <p className="text-xs text-gray-500">
        💡 提示：封面将从视频的指定时间点提取。默认从第 1 秒开始提取。
      </p>
    </div>
  )
}
