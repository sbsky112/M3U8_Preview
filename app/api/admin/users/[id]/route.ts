import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasAdminAccess } from '@/lib/permissions'
import { isDefaultAdmin } from '@/lib/init-admin'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().optional(),
  role: z.enum(['admin', 'user']).optional(),
})

// 更新用户信息（管理员）
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateUserSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 不能修改默认管理员
    if (isDefaultAdmin(user.username)) {
      return NextResponse.json(
        { error: '不能修改默认管理员账号' },
        { status: 403 }
      )
    }

    // 不能将其他用户设置为管理员（系统只有一个管理员）
    if (data.role === 'admin') {
      return NextResponse.json(
        { error: '系统只允许存在一个管理员账号' },
        { status: 403 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('更新用户失败:', error)
    return NextResponse.json(
      { error: '更新用户失败' },
      { status: 500 }
    )
  }
}

// 删除用户（管理员）
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 不能删除默认管理员
    if (isDefaultAdmin(user.username)) {
      return NextResponse.json(
        { error: '不能删除默认管理员账号' },
        { status: 403 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除用户失败:', error)
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    )
  }
}
