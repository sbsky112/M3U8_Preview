'use client'

import { useEffect, useRef, useState } from 'react'

interface VideoPlayerProps {
  url: string
  title?: string
  thumbnail?: string
}

export default function VideoPlayer({ url, title, thumbnail }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const hlsRef = useRef<any>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let mounted = true
    
    // 动态导入 DPlayer 和 Hls.js（仅在客户端）
    const loadPlayer = async () => {
      if (containerRef.current && !playerRef.current && mounted) {
        try {
          // 动态导入依赖
          const DPlayer = (await import('dplayer')).default
          const Hls = (await import('hls.js')).default

          // 检查 HLS 支持
          if (!Hls.isSupported()) {
            setError('您的浏览器不支持 HLS 播放')
            return
          }

          // 如果组件已卸载，不创建播放器
          if (!mounted) return

          playerRef.current = new DPlayer({
            container: containerRef.current,
            video: {
              url: url,
              type: 'customHls',
              customType: {
                customHls: function (video: HTMLVideoElement, player: any) {
                  const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: false,
                    backBufferLength: 90,
                  })
                  
                  hlsRef.current = hls

                  // HLS 错误处理
                  hls.on(Hls.Events.ERROR, function (event: any, data: any) {
                    if (data.fatal) {
                      switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                          console.error('网络错误，尝试恢复...')
                          hls.startLoad()
                          break
                        case Hls.ErrorTypes.MEDIA_ERROR:
                          console.error('媒体错误，尝试恢复...')
                          hls.recoverMediaError()
                          break
                        default:
                          console.error('无法恢复的错误:', data)
                          setError('视频加载失败')
                          hls.destroy()
                          break
                      }
                    }
                  })

                  hls.loadSource(video.src)
                  hls.attachMedia(video)

                  // 等待 manifest 加载完成
                  hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    console.log('视频清单加载成功')
                  })
                },
              },
              pic: thumbnail,
            },
            autoplay: false,
            theme: '#667eea',
            loop: false,
            lang: 'zh-cn',
            screenshot: true,
            hotkey: true,
            preload: 'metadata',
            volume: 0.7,
            mutex: true,
          })

          // 播放器事件监听
          playerRef.current.on('error', function () {
            console.error('播放器错误')
            setError('视频播放出错')
          })

        } catch (error) {
          console.error('加载播放器失败:', error)
          setError('播放器加载失败')
        }
      }
    }

    loadPlayer()

    return () => {
      mounted = false

      // 立即暂停播放
      if (playerRef.current && playerRef.current.video) {
        try {
          playerRef.current.video.pause()
        } catch (e) {
          console.error('暂停播放失败:', e)
        }
      }

      // 清理 HLS 实例
      if (hlsRef.current) {
        try {
          // 停止加载
          hlsRef.current.stopLoad()
          // 销毁实例
          hlsRef.current.destroy()
        } catch (e) {
          console.error('销毁 HLS 失败:', e)
        }
        hlsRef.current = null
      }

      // 清理播放器
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
      {title && (
        <h2 className="text-2xl font-bold mb-4 gradient-text">
          {title}
        </h2>
      )}
      
      {error ? (
        <div className="w-full aspect-video bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center">
          <div className="text-center p-8">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 font-medium text-lg">{error}</p>
            <p className="text-red-600 text-sm mt-2">请检查视频链接是否正确</p>
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl" />
      )}
    </div>
  )
}
