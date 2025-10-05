import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const videoSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  m3u8Url: z.string().url('无效的 M3U8 链接'),
  thumbnail: z.string().optional(),
  duration: z.number().optional(),
})

// 获取视频列表
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      }),
      prisma.video.count(),
    ])

    return NextResponse.json({
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('获取视频列表失败:', error)
    return NextResponse.json(
      { error: '获取视频列表失败' },
      { status: 500 }
    )
  }
}

// 创建视频（仅管理员）
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
        { error: '只有管理员可以上传视频' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = videoSchema.parse(body)

    const video = await prisma.video.create({
      data: {
        ...data,
        userId: (session.user as any).id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('创建视频失败:', error)
    return NextResponse.json(
      { error: '创建视频失败' },
      { status: 500 }
    )
  }
}
