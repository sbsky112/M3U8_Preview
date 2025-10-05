/**
 * 客户端视频封面提取工具
 * 使用 HTML5 Video API 从 M3U8 视频提取首帧
 */

/**
 * 从视频 URL 提取首帧作为封面
 * @param videoUrl - 视频 URL（支持 M3U8）
 * @param seekTime - 提取的时间点（秒），默认为 1 秒
 * @returns Base64 编码的图片数据
 */
export async function extractVideoThumbnail(
  videoUrl: string,
  seekTime: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      reject(new Error('无法创建 Canvas 上下文'))
      return
    }

    video.crossOrigin = 'anonymous'
    video.preload = 'metadata'
    video.muted = true

    // 设置超时
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('提取封面超时'))
    }, 30000) // 30秒超时

    const cleanup = () => {
      clearTimeout(timeout)
      video.pause()
      video.src = ''
      video.load()
    }

    video.addEventListener('loadedmetadata', () => {
      // 设置 canvas 尺寸
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // 跳转到指定时间点
      video.currentTime = Math.min(seekTime, video.duration)
    })

    video.addEventListener('seeked', () => {
      try {
        // 绘制视频帧到 canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // 转换为 Base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        
        cleanup()
        resolve(dataUrl)
      } catch (error) {
        cleanup()
        reject(error)
      }
    })

    video.addEventListener('error', (e) => {
      cleanup()
      reject(new Error('视频加载失败: ' + (video.error?.message || '未知错误')))
    })

    video.src = videoUrl
    video.load()
  })
}

/**
 * 将 Base64 图片转换为 Blob
 * @param dataUrl - Base64 编码的图片
 * @returns Blob 对象
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  
  return new Blob([u8arr], { type: mime })
}

/**
 * 将 Base64 图片转换为 File
 * @param dataUrl - Base64 编码的图片
 * @param filename - 文件名
 * @returns File 对象
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const blob = dataUrlToBlob(dataUrl)
  return new File([blob], filename, { type: blob.type })
}

/**
 * 使用 HLS.js 加载 M3U8 视频并提取封面（优化版）
 * @param m3u8Url - M3U8 视频链接
 * @param seekTime - 提取的时间点（秒），默认为 0.5 秒（更快）
 * @param options - 配置选项
 * @returns Base64 编码的图片数据
 */
export async function extractM3U8Thumbnail(
  m3u8Url: string,
  seekTime: number = 0.5,
  options: {
    timeout?: number
    quality?: number
    maxWidth?: number
  } = {}
): Promise<string> {
  const {
    timeout = 15000, // 减少到 15 秒
    quality = 0.7, // 降低质量以减小体积
    maxWidth = 640, // 最大宽度，减小图片体积
  } = options

  // 动态导入 HLS.js
  const Hls = (await import('hls.js')).default

  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      reject(new Error('无法创建 Canvas 上下文'))
      return
    }

    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'

    let timeoutId: NodeJS.Timeout | null = null
    let isResolved = false

    const timeoutHandler = setTimeout(() => {
      if (!isResolved) {
        cleanup()
        reject(new Error('提取封面超时 (15秒)'))
      }
    }, timeout)

    const cleanup = () => {
      isResolved = true
      if (timeoutHandler) clearTimeout(timeoutHandler)
      if (timeoutId) clearTimeout(timeoutId)
      if (hls) {
        try {
          hls.destroy()
        } catch (e) {
          // 忽略清理错误
        }
      }
      try {
        video.pause()
        video.src = ''
        video.load()
        video.remove()
      } catch (e) {
        // 忽略清理错误
      }
    }

    let hls: any = null
    let hasStartedSeeking = false

    if (Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 3, // 减少缓冲
        maxMaxBufferLength: 5,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 0,
      })

      hls.loadSource(m3u8Url)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // 不自动播放，直接等待元数据
      })

      hls.on(Hls.Events.ERROR, (event: any, data: any) => {
        if (data.fatal && !isResolved) {
          cleanup()
          reject(new Error('HLS 加载失败: ' + data.type))
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari 原生支持 HLS
      video.src = m3u8Url
      video.load()
    } else {
      reject(new Error('浏览器不支持 HLS 播放'))
      return
    }

    video.addEventListener('loadedmetadata', () => {
      if (isResolved) return

      // 设置 canvas 尺寸，限制最大宽度
      let width = video.videoWidth
      let height = video.videoHeight

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      // 立即跳转到指定时间点
      const targetTime = Math.min(seekTime, video.duration || 1)
      video.currentTime = targetTime
      hasStartedSeeking = true
    })

    video.addEventListener('seeked', () => {
      if (isResolved || !hasStartedSeeking) return

      try {
        // 绘制视频帧
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        
        cleanup()
        resolve(dataUrl)
      } catch (error) {
        if (!isResolved) {
          cleanup()
          reject(error)
        }
      }
    })

    video.addEventListener('error', () => {
      if (!isResolved) {
        cleanup()
        reject(new Error('视频加载失败'))
      }
    })

    // 备用方案：如果 loadedmetadata 没有触发，在 canplay 时也尝试
    video.addEventListener('canplay', () => {
      if (!hasStartedSeeking && !isResolved) {
        timeoutId = setTimeout(() => {
          if (!hasStartedSeeking && !isResolved) {
            const targetTime = Math.min(seekTime, video.duration || 1)
            video.currentTime = targetTime
            hasStartedSeeking = true
          }
        }, 100)
      }
    })
  })
}
