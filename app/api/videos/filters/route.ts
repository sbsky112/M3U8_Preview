import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 强制动态渲染
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 获取筛选器选项（作者列表、分类列表）
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 获取所有不重复的作者
    const authorsResult = await prisma.video.findMany({
      where: {
        author: {
          not: null,
        },
      },
      select: {
        author: true,
      },
      distinct: ['author'],
      orderBy: {
        author: 'asc',
      },
    })
    const authors = authorsResult
      .map(v => v.author)
      .filter(Boolean) as string[]

    // 获取所有不重复的分类
    const categoriesResult = await prisma.video.findMany({
      where: {
        category: {
          not: null,
        },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    })
    const categories = categoriesResult
      .map(v => v.category)
      .filter(Boolean) as string[]

    return NextResponse.json({
      authors,
      categories,
    })
  } catch (error) {
    console.error('获取筛选器选项失败:', error)
    return NextResponse.json(
      { error: '获取筛选器选项失败' },
      { status: 500 }
    )
  }
}
