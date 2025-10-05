# 视频封面提取功能说明

## 🎯 功能概述

本项目实现了**客户端视频封面提取功能**，使用 HTML5 Video API 和 HLS.js 直接在浏览器中从 M3U8 视频提取首帧作为封面，**无需服务端 ffmpeg 支持**。

## ✨ 特点

- ✅ **纯客户端实现** - 无需服务端处理
- ✅ **支持 M3U8 格式** - 使用 HLS.js 加载视频
- ✅ **自定义提取时间点** - 可以指定从视频的任意时间点提取
- ✅ **实时预览** - 提取后立即显示封面预览
- ✅ **Base64 编码** - 直接保存到数据库，无需额外存储
- ✅ **跨浏览器兼容** - 支持现代浏览器

## 📁 文件结构

```
lib/
  └── video-thumbnail.ts       # 封面提取核心工具函数

components/
  └── ThumbnailExtractor.tsx   # 封面提取 React 组件

app/videos/upload/
  └── page.tsx                 # 集成了封面提取的上传页面
```

## 🔧 核心实现

### 1. 工具函数 (`lib/video-thumbnail.ts`)

提供了以下主要函数：

#### `extractM3U8Thumbnail(m3u8Url, seekTime)`

从 M3U8 视频提取首帧封面。

```typescript
import { extractM3U8Thumbnail } from '@/lib/video-thumbnail'

// 从视频第 1 秒提取封面
const thumbnail = await extractM3U8Thumbnail('https://example.com/video.m3u8', 1)
// 返回 Base64 编码的图片数据：data:image/jpeg;base64,...
```

**参数：**
- `m3u8Url` (string): M3U8 视频链接
- `seekTime` (number): 提取时间点（秒），默认为 1

**返回：**
- Promise<string>: Base64 编码的 JPEG 图片数据

#### `extractVideoThumbnail(videoUrl, seekTime)`

通用视频封面提取（支持 MP4、WebM 等）。

```typescript
const thumbnail = await extractVideoThumbnail('https://example.com/video.mp4', 2)
```

#### `dataUrlToBlob(dataUrl)`

将 Base64 图片转换为 Blob 对象。

```typescript
const blob = dataUrlToBlob(thumbnail)
```

#### `dataUrlToFile(dataUrl, filename)`

将 Base64 图片转换为 File 对象。

```typescript
const file = dataUrlToFile(thumbnail, 'thumbnail.jpg')
```

### 2. React 组件 (`components/ThumbnailExtractor.tsx`)

提供了一个可复用的封面提取 UI 组件。

```tsx
import ThumbnailExtractor from '@/components/ThumbnailExtractor'

<ThumbnailExtractor
  m3u8Url="https://example.com/video.m3u8"
  onThumbnailExtracted={(dataUrl) => {
    console.log('封面已提取:', dataUrl)
    // 处理提取的封面
  }}
/>
```

**Props：**
- `m3u8Url` (string): M3U8 视频链接
- `onThumbnailExtracted` (function): 提取成功的回调函数

## 📖 使用指南

### 在上传页面使用

上传视频时，可以自动提取封面：

1. 输入 M3U8 视频链接
2. 设置提取时间点（默认 1 秒）
3. 点击"提取封面"按钮
4. 等待提取完成
5. 预览提取的封面
6. 上传视频时封面会自动包含

### 手动使用工具函数

```typescript
import { extractM3U8Thumbnail } from '@/lib/video-thumbnail'

async function getThumbnail() {
  try {
    // 从第 2 秒提取封面
    const thumbnail = await extractM3U8Thumbnail(
      'https://example.com/video.m3u8',
      2
    )
    
    console.log('封面已提取:', thumbnail)
    // thumbnail 是 Base64 格式: data:image/jpeg;base64,...
    
    // 可以直接用于 img 标签
    document.querySelector('img').src = thumbnail
    
    // 或保存到状态
    setThumbnail(thumbnail)
  } catch (error) {
    console.error('提取失败:', error)
  }
}
```

### 批量提取封面

```typescript
import { extractM3U8Thumbnail } from '@/lib/video-thumbnail'

async function extractMultipleThumbnails(videoUrls: string[]) {
  const thumbnails = await Promise.all(
    videoUrls.map(url => extractM3U8Thumbnail(url, 1))
  )
  
  return thumbnails
}
```

## 🎨 工作原理

### 技术流程

1. **创建 Video 元素**
   - 在内存中创建 `<video>` 元素
   - 设置 crossOrigin 和静音属性

2. **加载 HLS 视频**
   - 使用 HLS.js 库加载 M3U8 视频
   - 等待视频元数据加载完成

3. **跳转到指定时间**
   - 设置 `video.currentTime` 到指定时间点
   - 等待 seeked 事件触发

4. **提取视频帧**
   - 创建 Canvas 元素
   - 使用 `context.drawImage()` 绘制视频帧
   - 转换为 Base64 JPEG 格式

5. **清理资源**
   - 销毁 HLS 实例
   - 清理 Video 元素

### 示意图

```
M3U8 URL
    ↓
HLS.js 加载视频
    ↓
跳转到指定时间点
    ↓
Canvas 绘制当前帧
    ↓
转换为 Base64 JPEG
    ↓
返回封面数据
```

## ⚙️ 配置选项

### 提取质量

在 `lib/video-thumbnail.ts` 中修改 JPEG 质量：

```typescript
// 默认质量 0.8 (80%)
const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

// 高质量 (文件更大)
const dataUrl = canvas.toDataURL('image/jpeg', 0.95)

// 低质量 (文件更小)
const dataUrl = canvas.toDataURL('image/jpeg', 0.5)
```

### 封面尺寸

封面尺寸自动匹配视频分辨率。如需调整：

```typescript
// 在 extractM3U8Thumbnail 函数中
canvas.width = video.videoWidth / 2  // 缩小到一半
canvas.height = video.videoHeight / 2
```

### 超时设置

默认 30 秒超时，可以调整：

```typescript
// 在函数中修改
const timeout = setTimeout(() => {
  cleanup()
  reject(new Error('提取封面超时'))
}, 60000) // 改为 60 秒
```

## 🌐 浏览器兼容性

| 浏览器 | 支持情况 | 说明 |
|--------|---------|------|
| Chrome 80+ | ✅ 完全支持 | - |
| Firefox 75+ | ✅ 完全支持 | - |
| Edge 80+ | ✅ 完全支持 | - |
| Safari 13+ | ✅ 原生 HLS | 无需 HLS.js |
| Opera 67+ | ✅ 完全支持 | - |
| IE 11 | ❌ 不支持 | - |

## ⚠️ 注意事项

### 1. CORS 跨域问题

如果视频源有 CORS 限制，提取会失败。解决方法：

- 确保视频服务器设置了正确的 CORS 头
- 或使用代理服务器

### 2. 视频格式

仅支持浏览器能播放的格式：
- ✅ M3U8 (HLS)
- ✅ MP4
- ✅ WebM
- ❌ 不常见的编码格式可能不支持

### 3. 性能考虑

- 提取封面需要加载视频元数据
- 可能需要几秒钟时间
- 建议显示加载状态

### 4. 存储

Base64 编码的图片比较大：
- 适合直接存储到数据库
- 不适合大量图片或高分辨率封面
- 可以考虑上传到图床并保存 URL

## 🔄 从旧版本迁移

如果你之前使用服务端 ffmpeg 方案：

### 旧方案（服务端）
```typescript
// 调用服务端 API
const response = await fetch('/api/videos/thumbnail', {
  method: 'POST',
  body: JSON.stringify({ m3u8Url })
})
```

### 新方案（客户端）
```typescript
// 直接在客户端提取
import { extractM3U8Thumbnail } from '@/lib/video-thumbnail'
const thumbnail = await extractM3U8Thumbnail(m3u8Url, 1)
```

**优势：**
- 无需服务端配置 ffmpeg
- 速度更快（无网络延迟）
- 降低服务器负载
- 支持实时预览

## 📊 性能优化建议

1. **缓存提取结果**
   ```typescript
   const thumbnailCache = new Map()
   
   async function getCachedThumbnail(url: string) {
     if (thumbnailCache.has(url)) {
       return thumbnailCache.get(url)
     }
     const thumbnail = await extractM3U8Thumbnail(url)
     thumbnailCache.set(url, thumbnail)
     return thumbnail
   }
   ```

2. **批量提取时限制并发**
   ```typescript
   import pLimit from 'p-limit'
   
   const limit = pLimit(3) // 最多 3 个并发
   
   const thumbnails = await Promise.all(
     urls.map(url => limit(() => extractM3U8Thumbnail(url)))
   )
   ```

3. **降低图片质量减小体积**
   ```typescript
   canvas.toDataURL('image/jpeg', 0.6) // 降低到 60% 质量
   ```

## 🐛 故障排查

### 问题 1: 提取失败

**错误**: "视频加载失败"

**解决**:
- 检查 M3U8 链接是否有效
- 确认没有 CORS 限制
- 尝试在浏览器中直接播放视频

### 问题 2: 提取超时

**错误**: "提取封面超时"

**解决**:
- 检查网络连接
- 增加超时时间
- 尝试更早的时间点（如 0.5 秒）

### 问题 3: 封面是黑屏

**原因**: 提取时间点太早，视频还没有画面

**解决**:
- 增加提取时间（如 2-3 秒）
- 检查视频本身是否正常

## 📚 相关资源

- [HLS.js 文档](https://github.com/video-dev/hls.js/)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [HTMLVideoElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement)

## 🎉 总结

客户端封面提取功能的优势：

- ✅ 无需服务端 ffmpeg
- ✅ 部署简单
- ✅ 速度快
- ✅ 降低服务器负载
- ✅ 实时预览
- ✅ 跨平台兼容

适合大多数 M3U8 视频场景！
