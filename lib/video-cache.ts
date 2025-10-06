interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

class VideoCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultExpiry = 5 * 60 * 1000 // 5分钟

  set<T>(key: string, data: T, expiryMs?: number): void {
    const expiry = Date.now() + (expiryMs || this.defaultExpiry)
    this.cache.set(key, { data, timestamp: Date.now(), expiry })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }

  clearExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key)
      }
    }
  }

  // 生成缓存键
  generateKey(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key]
        return result
      }, {} as Record<string, any>)

    return JSON.stringify(sortedParams)
  }
}

// 创建全局缓存实例
const videoCache = new VideoCache()

export { videoCache }
export type { CacheEntry }