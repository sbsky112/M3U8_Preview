import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasAdminAccess } from '@/lib/permissions'

// 强制动态渲染
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 获取统计信息（管理员）
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const [
      totalUsers,
      totalVideos,
      adminCount,
      recentUsers,
      recentVideos,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.video.count(),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 最近7天
          },
        },
      }),
      prisma.video.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 最近7天
          },
        },
      }),
    ])

    return NextResponse.json({
      totalUsers,
      totalVideos,
      adminCount,
      userCount: totalUsers - adminCount,
      recentUsers,
      recentVideos,
    })
  } catch (error) {
    console.error('获取统计信息失败:', error)
    return NextResponse.json(
      { error: '获取统计信息失败' },
      { status: 500 }
    )
  }
}
