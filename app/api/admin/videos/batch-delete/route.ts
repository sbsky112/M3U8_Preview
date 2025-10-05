import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 检查是否为管理员
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { role: true },
    })

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: '只有管理员可以批量删除视频' },
        { status: 403 }
      )
    }

    const { videoIds } = await request.json()

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json(
        { error: '请提供要删除的视频ID列表' },
        { status: 400 }
      )
    }

    // 批量删除视频
    const result = await prisma.video.deleteMany({
      where: {
        id: {
          in: videoIds
        }
      }
    })

    return NextResponse.json({
      message: `成功删除 ${result.count} 个视频`,
      count: result.count
    })
  } catch (error) {
    console.error('批量删除视频失败:', error)
    return NextResponse.json(
      { error: '批量删除视频失败' },
      { status: 500 }
    )
  }
}
