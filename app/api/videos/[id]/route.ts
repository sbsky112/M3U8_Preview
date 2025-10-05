import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const videoSchema = z.object({
  title: z.string().min(1, '标题不能为空').optional(),
  description: z.string().optional(),
  m3u8Url: z.string().url('无效的 M3U8 链接').optional(),
  thumbnail: z.string().optional(),
  duration: z.number().optional(),
})

// 获取单个视频
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const video = await prisma.video.findUnique({
      where: { id: params.id },
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

    if (!video) {
      return NextResponse.json({ error: '视频不存在' }, { status: 404 })
    }

    return NextResponse.json(video)
  } catch (error) {
    console.error('获取视频失败:', error)
    return NextResponse.json(
      { error: '获取视频失败' },
      { status: 500 }
    )
  }
}

// 更新视频
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const data = videoSchema.parse(body)

    const video = await prisma.video.findUnique({
      where: { id: params.id },
    })

    if (!video) {
      return NextResponse.json({ error: '视频不存在' }, { status: 404 })
    }

    // 检查权限（只有创建者可以编辑）
    if (video.userId !== (session.user as any).id) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const updatedVideo = await prisma.video.update({
      where: { id: params.id },
      data,
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

    return NextResponse.json(updatedVideo)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('更新视频失败:', error)
    return NextResponse.json(
      { error: '更新视频失败' },
      { status: 500 }
    )
  }
}

// 删除视频
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const video = await prisma.video.findUnique({
      where: { id: params.id },
    })

    if (!video) {
      return NextResponse.json({ error: '视频不存在' }, { status: 404 })
    }

    // 检查权限（只有创建者可以删除）
    if (video.userId !== (session.user as any).id) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    await prisma.video.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除视频失败:', error)
    return NextResponse.json(
      { error: '删除视频失败' },
      { status: 500 }
    )
  }
}
