/**
 * 视频封面缓存管理工具
 * 使用 localStorage 和内存缓存来存储提取的封面
 */

const CACHE_PREFIX = 'video_thumbnail_'
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7天过期
const MAX_CACHE_SIZE = 500 // 最多缓存 500 个封面

// 内存缓存，用于快速访问
const memoryCache = new Map<string, string>()

interface CacheItem {
  thumbnail: string
  timestamp: number
  url: string
}

/**
 * 生成缓存 key
 */
function getCacheKey(videoId: string): string {
  return `${CACHE_PREFIX}${videoId}`
}

/**
 * 从缓存获取封面
 */
export function getThumbnailFromCache(videoId: string, m3u8Url: string): string | null {
  // 1. 先检查内存缓存
  if (memoryCache.has(videoId)) {
    return memoryCache.get(videoId)!
  }

  // 2. 检查 localStorage
  try {
    const key = getCacheKey(videoId)
    const cached = localStorage.getItem(key)
    
    if (!cached) return null

    const item: CacheItem = JSON.parse(cached)
    
    // 检查是否过期
    if (Date.now() - item.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key)
      return null
    }

    // 检查 URL 是否匹配（如果视频 URL 变了，缓存失效）
    if (item.url !== m3u8Url) {
      localStorage.removeItem(key)
      return null
    }

    // 添加到内存缓存
    memoryCache.set(videoId, item.thumbnail)
    
    return item.thumbnail
  } catch (error) {
    console.error('读取缓存失败:', error)
    return null
  }
}

/**
 * 保存封面到缓存
 */
export function saveThumbnailToCache(
  videoId: string,
  m3u8Url: string,
  thumbnail: string
): boolean {
  try {
    // 1. 保存到内存缓存
    memoryCache.set(videoId, thumbnail)

    // 2. 保存到 localStorage
    const item: CacheItem = {
      thumbnail,
      timestamp: Date.now(),
      url: m3u8Url,
    }

    const key = getCacheKey(videoId)
    localStorage.setItem(key, JSON.stringify(item))

    // 3. 清理旧缓存
    cleanupOldCache()

    return true
  } catch (error) {
    console.error('保存缓存失败:', error)
    
    // 如果是 localStorage 满了，清理一些旧缓存
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      cleanupOldCache(true)
      // 重试一次
      try {
        const key = getCacheKey(videoId)
        const item: CacheItem = {
          thumbnail,
          timestamp: Date.now(),
          url: m3u8Url,
        }
        localStorage.setItem(key, JSON.stringify(item))
        return true
      } catch (e) {
        console.error('重试保存失败:', e)
      }
    }
    
    return false
  }
}

/**
 * 清理旧缓存
 */
function cleanupOldCache(force: boolean = false) {
  try {
    const keys: string[] = []
    
    // 收集所有缓存 key
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        keys.push(key)
      }
    }

    // 如果缓存数量超过限制，或强制清理
    if (keys.length > MAX_CACHE_SIZE || force) {
      // 按时间戳排序，删除最旧的
      const items = keys.map(key => {
        try {
          const item = JSON.parse(localStorage.getItem(key)!)
          return { key, timestamp: item.timestamp }
        } catch {
          return { key, timestamp: 0 }
        }
      }).sort((a, b) => a.timestamp - b.timestamp)

      // 删除最旧的一半
      const deleteCount = force ? Math.floor(items.length / 2) : items.length - MAX_CACHE_SIZE
      for (let i = 0; i < deleteCount; i++) {
        localStorage.removeItem(items[i].key)
      }
    }
  } catch (error) {
    console.error('清理缓存失败:', error)
  }
}

/**
 * 清除特定视频的缓存
 */
export function clearThumbnailCache(videoId: string) {
  memoryCache.delete(videoId)
  const key = getCacheKey(videoId)
  localStorage.removeItem(key)
}

/**
 * 清除所有封面缓存
 */
export function clearAllThumbnailCache() {
  memoryCache.clear()
  
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(CACHE_PREFIX)) {
      keys.push(key)
    }
  }
  
  keys.forEach(key => localStorage.removeItem(key))
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats(): {
  count: number
  memoryCount: number
  totalSize: number
} {
  let count = 0
  let totalSize = 0

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(CACHE_PREFIX)) {
      count++
      const value = localStorage.getItem(key)
      if (value) {
        totalSize += value.length
      }
    }
  }

  return {
    count,
    memoryCount: memoryCache.size,
    totalSize,
  }
}
