# 视频封面提取 - 快速指南

## 🚀 5 分钟上手

### 方法 1: 在上传页面使用（推荐）

1. **访问上传页面**
   ```
   http://localhost:3000/videos/upload
   ```

2. **输入视频信息**
   - 标题: 我的视频
   - M3U8 链接: https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8

3. **提取封面**
   - 在"封面图片"部分，你会看到封面提取工具
   - 设置提取时间点（默认 1 秒）
   - 点击"提取封面"按钮
   - 等待几秒钟，封面就会自动提取并显示预览

4. **上传视频**
   - 封面已自动填充
   - 点击"上传视频"完成

### 方法 2: 编程方式使用

```typescript
// 1. 导入工具函数
import { extractM3U8Thumbnail } from '@/lib/video-thumbnail'

// 2. 提取封面
async function handleExtractThumbnail() {
  try {
    const m3u8Url = 'https://example.com/video.m3u8'
    const seekTime = 1 // 从第 1 秒提取
    
    // 提取封面
    const thumbnail = await extractM3U8Thumbnail(m3u8Url, seekTime)
    
    // thumbnail 是 Base64 格式的图片
    console.log('封面已提取:', thumbnail)
    
    // 可以直接用于 <img> 标签
    document.querySelector('img').src = thumbnail
    
    // 或保存到状态
    setThumbnailData(thumbnail)
    
  } catch (error) {
    console.error('提取失败:', error.message)
  }
}
```

### 方法 3: 使用 React 组件

```tsx
import ThumbnailExtractor from '@/components/ThumbnailExtractor'

function MyComponent() {
  const [thumbnail, setThumbnail] = useState('')
  
  return (
    <div>
      <ThumbnailExtractor
        m3u8Url="https://example.com/video.m3u8"
        onThumbnailExtracted={(dataUrl) => {
          setThumbnail(dataUrl)
          console.log('封面提取成功！')
        }}
      />
      
      {thumbnail && (
        <img src={thumbnail} alt="视频封面" />
      )}
    </div>
  )
}
```

## 📝 常见场景

### 场景 1: 批量提取多个视频封面

```typescript
import { extractM3U8Thumbnail } from '@/lib/video-thumbnail'

const videos = [
  'https://example.com/video1.m3u8',
  'https://example.com/video2.m3u8',
  'https://example.com/video3.m3u8',
]

async function extractAllThumbnails() {
  const thumbnails = await Promise.all(
    videos.map(url => extractM3U8Thumbnail(url, 1))
  )
  
  console.log('提取了', thumbnails.length, '个封面')
  return thumbnails
}
```

### 场景 2: 提取多个时间点的封面

```typescript
async function extractMultipleFrames(videoUrl: string) {
  const timePoints = [1, 5, 10, 15, 20] // 秒
  
  const frames = await Promise.all(
    timePoints.map(time => extractM3U8Thumbnail(videoUrl, time))
  )
  
  return frames
}
```

### 场景 3: 将 Base64 转换为文件上传

```typescript
import { dataUrlToFile } from '@/lib/video-thumbnail'

async function uploadThumbnail(videoUrl: string) {
  // 1. 提取封面
  const dataUrl = await extractM3U8Thumbnail(videoUrl, 1)
  
  // 2. 转换为 File 对象
  const file = dataUrlToFile(dataUrl, 'thumbnail.jpg')
  
  // 3. 上传到服务器
  const formData = new FormData()
  formData.append('thumbnail', file)
  
  await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })
}
```

### 场景 4: 提取封面时显示进度

```typescript
import { useState } from 'react'
import { extractM3U8Thumbnail } from '@/lib/video-thumbnail'

function ThumbnailWithProgress() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [thumbnail, setThumbnail] = useState('')
  
  async function extract() {
    setLoading(true)
    setProgress(10)
    
    try {
      setProgress(30)
      const result = await extractM3U8Thumbnail(
        'https://example.com/video.m3u8',
        1
      )
      setProgress(100)
      setThumbnail(result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      <button onClick={extract} disabled={loading}>
        {loading ? `提取中... ${progress}%` : '提取封面'}
      </button>
      {thumbnail && <img src={thumbnail} />}
    </div>
  )
}
```

## 🎯 最佳实践

### 1. 错误处理

```typescript
try {
  const thumbnail = await extractM3U8Thumbnail(url, 1)
  // 成功
} catch (error) {
  if (error.message.includes('CORS')) {
    alert('视频源不允许跨域访问')
  } else if (error.message.includes('超时')) {
    alert('提取超时，请检查网络连接')
  } else {
    alert('提取失败: ' + error.message)
  }
}
```

### 2. 缓存提取结果

```typescript
const thumbnailCache = new Map<string, string>()

async function getCachedThumbnail(url: string) {
  // 检查缓存
  if (thumbnailCache.has(url)) {
    return thumbnailCache.get(url)!
  }
  
  // 提取并缓存
  const thumbnail = await extractM3U8Thumbnail(url, 1)
  thumbnailCache.set(url, thumbnail)
  
  return thumbnail
}
```

### 3. 降低图片质量以减小大小

修改 `lib/video-thumbnail.ts` 中的质量参数：

```typescript
// 默认 0.8 (80%)
const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

// 改为 0.6 (60%) 减小文件大小
const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
```

### 4. 选择最佳提取时间点

```typescript
// 不要从 0 秒开始（可能是黑屏或加载画面）
const thumbnail = await extractM3U8Thumbnail(url, 1)  // ✅ 推荐

// 或者从视频中间位置
const thumbnail = await extractM3U8Thumbnail(url, 5)
```

## ⚡ 性能提示

1. **批量提取时限制并发数**
   ```typescript
   // 每次最多提取 3 个
   for (let i = 0; i < urls.length; i += 3) {
     const batch = urls.slice(i, i + 3)
     await Promise.all(batch.map(url => extractM3U8Thumbnail(url, 1)))
   }
   ```

2. **使用 Web Worker**（高级）
   ```typescript
   // 将封面提取放到 Worker 中，避免阻塞主线程
   const worker = new Worker('/thumbnail-worker.js')
   worker.postMessage({ url, seekTime: 1 })
   ```

3. **懒加载封面**
   ```typescript
   // 只在视口内的视频才提取封面
   const observer = new IntersectionObserver((entries) => {
     entries.forEach(entry => {
       if (entry.isIntersecting) {
         extractThumbnail(entry.target.dataset.videoUrl)
       }
     })
   })
   ```

## 🐛 常见问题

### Q: 提取失败怎么办？
A: 检查视频链接是否有效，是否有 CORS 限制。

### Q: 封面是黑屏？
A: 尝试增加提取时间点（如 2-3 秒）。

### Q: 提取很慢？
A: 这是正常的，需要加载视频元数据。可以显示加载提示。

### Q: 支持其他视频格式吗？
A: 支持浏览器能播放的所有格式（MP4、WebM 等）。

### Q: Base64 太大怎么办？
A: 可以降低图片质量，或上传到图床保存 URL。

## 📚 更多资源

- 详细文档: [THUMBNAIL_EXTRACTION.md](./THUMBNAIL_EXTRACTION.md)
- API 参考: 查看 `lib/video-thumbnail.ts` 的注释
- 示例代码: `app/videos/upload/page.tsx`

## 🎉 开始使用

现在就去 [上传页面](http://localhost:3000/videos/upload) 试试吧！

---

有问题？查看 [完整文档](./THUMBNAIL_EXTRACTION.md) 或提交 Issue。
