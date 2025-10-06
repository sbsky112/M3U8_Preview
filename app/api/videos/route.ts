import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { buildVideoWhereClause, validateSearchParams, VideoSearchParams } from '@/lib/video-search'

const videoSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  m3u8Url: z.string().url('无效的 M3U8 链接'),
  thumbnail: z.string().optional(),
  duration: z.number().optional(),
  author: z.string().optional(),
  category: z.string().optional(),
})

// 获取视频列表
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // 提取搜索参数
    const rawParams: Partial<VideoSearchParams> = {
      search: searchParams.get('search') || undefined,
      exactMatch: searchParams.get('exactMatch') === 'true',
      category: searchParams.get('category') || undefined,
      author: searchParams.get('author') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    }

    // 验证和清理参数
    const validation = validateSearchParams(rawParams)
    if (!validation.isValid && validation.errors.length > 0) {
      console.warn('搜索参数验证警告:', validation.errors)
    }

    const params = validation.sanitized
    const skip = (params.page - 1) * params.limit

    // 构建查询条件
    const where = buildVideoWhereClause(params)

    console.log('=== API调试信息 ===')
    console.log('数据库URL:', process.env.DATABASE_URL)
    console.log('搜索参数:', JSON.stringify(params, null, 2))
    console.log('查询条件:', JSON.stringify(where, null, 2))
    console.log('===================')

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        skip,
        take: params.limit,
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
      prisma.video.count({ where }),
    ])

    console.log('=== 查询结果 ===')
    console.log('找到视频数量:', videos.length)
    console.log('数据库总数:', total)
    console.log('视频列表:')
    videos.forEach((video, index) => {
      console.log(`  ${index + 1}. ${video.title} (ID: ${video.id})`)
    })
    console.log('===================')

    return NextResponse.json({
      videos,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
      searchParams: params, // 返回实际使用的搜索参数用于调试
    })
  } catch (error) {
    console.error('获取视频列表失败:', error)
    return NextResponse.json(
      { error: '获取视频列表失败', details: error instanceof Error ? error.message : '未知错误' },
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
