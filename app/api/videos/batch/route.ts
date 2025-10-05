import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const batchVideoSchema = z.object({
  videos: z.array(
    z.object({
      title: z.string().min(1, '标题不能为空'),
      description: z.string().optional(),
      m3u8Url: z.string().url('无效的 M3U8 链接'),
      thumbnail: z.string().optional(),
      duration: z.number().optional(),
      author: z.string().optional(),
      category: z.string().optional(),
    })
  ),
})

// 批量导入视频（仅管理员）
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
        { error: '只有管理员可以批量导入视频' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { videos } = batchVideoSchema.parse(body)

    const userId = (session.user as any).id

    // 批量创建视频
    const createdVideos = await prisma.video.createMany({
      data: videos.map((video) => ({
        ...video,
        userId,
      })),
    })

    return NextResponse.json(
      {
        message: `成功导入 ${createdVideos.count} 个视频`,
        count: createdVideos.count,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('批量导入视频失败:', error)
    return NextResponse.json(
      { error: '批量导入视频失败' },
      { status: 500 }
    )
  }
}
