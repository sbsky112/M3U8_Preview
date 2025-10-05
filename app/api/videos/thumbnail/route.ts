import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * 封面提取 API - 已废弃
 * 
 * 注意：此 API 已被客户端封面提取功能替代。
 * 新的实现使用客户端的 HTML5 Video API 和 HLS.js 直接提取视频首帧，
 * 无需服务端 ffmpeg 支持。
 * 
 * 客户端实现位于：
 * - lib/video-thumbnail.ts
 * - components/ThumbnailExtractor.tsx
 * 
 * 保留此 API 仅为向后兼容。
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    return NextResponse.json({
      message: '此 API 已废弃，请使用客户端封面提取功能',
      deprecated: true,
      info: '客户端封面提取使用 HTML5 Video API，无需服务端处理',
    }, { status: 410 }) // 410 Gone
  } catch (error) {
    console.error('API 错误:', error)
    return NextResponse.json(
      { error: 'API 已废弃' },
      { status: 410 }
    )
  }
}
