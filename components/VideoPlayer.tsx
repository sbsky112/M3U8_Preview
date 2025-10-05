'use client'

import { useEffect, useRef } from 'react'

interface VideoPlayerProps {
  url: string
  title?: string
  thumbnail?: string
}

export default function VideoPlayer({ url, title, thumbnail }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)

  useEffect(() => {
    // 动态导入 DPlayer 和 Hls.js（仅在客户端）
    const loadPlayer = async () => {
      if (containerRef.current && !playerRef.current) {
        try {
          // 动态导入依赖
          const DPlayer = (await import('dplayer')).default
          const Hls = (await import('hls.js')).default

          playerRef.current = new DPlayer({
            container: containerRef.current,
            video: {
              url: url,
              type: 'customHls',
              customType: {
                customHls: function (video: HTMLVideoElement, player: any) {
                  const hls = new Hls()
                  hls.loadSource(video.src)
                  hls.attachMedia(video)
                },
              },
              pic: thumbnail,
            },
            autoplay: false,
            theme: '#0ea5e9',
            loop: false,
            lang: 'zh-cn',
            screenshot: true,
            hotkey: true,
            preload: 'auto',
            volume: 0.7,
          })
        } catch (error) {
          console.error('加载播放器失败:', error)
        }
      }
    }

    loadPlayer()

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (e) {
          console.error('销毁播放器失败:', e)
        }
        playerRef.current = null
      }
    }
  }, [url, thumbnail])

  return (
    <div className="w-full">
      {title && <h2 className="text-2xl font-bold mb-4 text-gray-900">{title}</h2>}
      <div ref={containerRef} className="w-full aspect-video bg-black rounded-lg overflow-hidden" />
    </div>
  )
}
