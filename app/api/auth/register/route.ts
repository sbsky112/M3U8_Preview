import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { isRegistrationEnabled } from '@/lib/system-settings'

const registerSchema = z.object({
  username: z.string().min(3, '用户名至少需要3个字符').max(20, '用户名最多20个字符'),
  password: z.string().min(6, '密码至少需要6个字符'),
  name: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    // 检查注册是否开启
    const registrationEnabled = await isRegistrationEnabled()
    if (!registrationEnabled) {
      return NextResponse.json(
        { error: '系统暂时关闭了注册功能' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { username, password, name } = registerSchema.parse(body)

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '该用户名已被注册' },
        { status: 400 }
      )
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 检查是否是第一个用户，如果是则设为管理员
    const userCount = await prisma.user.count()
    const role = userCount === 0 ? 'admin' : 'user'

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: name || username,
        role,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('注册错误:', error)
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}
