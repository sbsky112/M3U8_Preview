import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CATEGORIES_KEY = 'video_categories'

// 获取分类列表
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 默认分类
    const defaultCategories = [
      '影视', '动漫', '综艺', '纪录片', '教育', '音乐',
      '游戏', '体育', '科技', '生活', '美食', '旅游', '其他'
    ]

    // 从数据库获取分类设置
    let setting = await prisma.systemSetting.findUnique({
      where: { key: CATEGORIES_KEY }
    })

    // 如果不存在，创建默认分类记录
    if (!setting) {
      setting = await prisma.systemSetting.create({
        data: {
          key: CATEGORIES_KEY,
          value: JSON.stringify(defaultCategories)
        }
      })
    }

    const categories = JSON.parse(setting.value)

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('获取分类列表失败:', error)
    return NextResponse.json(
      { error: '获取分类列表失败' },
      { status: 500 }
    )
  }
}

// 添加分类
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
        { error: '只有管理员可以管理分类' },
        { status: 403 }
      )
    }

    const { name } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '分类名称不能为空' },
        { status: 400 }
      )
    }

    // 获取当前分类列表
    const setting = await prisma.systemSetting.findUnique({
      where: { key: CATEGORIES_KEY }
    })

    const defaultCategories = [
      '影视', '动漫', '综艺', '纪录片', '教育', '音乐',
      '游戏', '体育', '科技', '生活', '美食', '旅游', '其他'
    ]

    let categories = setting 
      ? JSON.parse(setting.value)
      : defaultCategories

    // 检查是否已存在
    if (categories.includes(name.trim())) {
      return NextResponse.json(
        { error: '分类已存在' },
        { status: 400 }
      )
    }

    // 添加新分类
    categories.push(name.trim())

    // 保存到数据库
    await prisma.systemSetting.upsert({
      where: { key: CATEGORIES_KEY },
      update: { value: JSON.stringify(categories) },
      create: {
        key: CATEGORIES_KEY,
        value: JSON.stringify(categories),
      }
    })

    return NextResponse.json({ 
      message: '添加成功',
      categories 
    })
  } catch (error) {
    console.error('添加分类失败:', error)
    return NextResponse.json(
      { error: '添加分类失败' },
      { status: 500 }
    )
  }
}

// 修改分类
export async function PUT(request: Request) {
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
        { error: '只有管理员可以管理分类' },
        { status: 403 }
      )
    }

    const { oldName, newName } = await request.json()

    if (!oldName || !newName || !newName.trim()) {
      return NextResponse.json(
        { error: '分类名称不能为空' },
        { status: 400 }
      )
    }

    // 获取当前分类列表
    const setting = await prisma.systemSetting.findUnique({
      where: { key: CATEGORIES_KEY }
    })

    if (!setting) {
      return NextResponse.json(
        { error: '分类列表不存在' },
        { status: 404 }
      )
    }

    let categories = JSON.parse(setting.value)

    // 查找并替换
    const index = categories.indexOf(oldName)
    if (index === -1) {
      return NextResponse.json(
        { error: '原分类不存在' },
        { status: 404 }
      )
    }

    // 检查新名称是否已存在
    if (categories.includes(newName.trim()) && oldName !== newName.trim()) {
      return NextResponse.json(
        { error: '新分类名称已存在' },
        { status: 400 }
      )
    }

    categories[index] = newName.trim()

    // 保存到数据库
    await prisma.systemSetting.update({
      where: { key: CATEGORIES_KEY },
      data: { value: JSON.stringify(categories) }
    })

    return NextResponse.json({ 
      message: '修改成功',
      categories 
    })
  } catch (error) {
    console.error('修改分类失败:', error)
    return NextResponse.json(
      { error: '修改分类失败' },
      { status: 500 }
    )
  }
}

// 删除分类
export async function DELETE(request: Request) {
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
        { error: '只有管理员可以管理分类' },
        { status: 403 }
      )
    }

    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: '分类名称不能为空' },
        { status: 400 }
      )
    }

    // 获取当前分类列表
    const setting = await prisma.systemSetting.findUnique({
      where: { key: CATEGORIES_KEY }
    })

    if (!setting) {
      return NextResponse.json(
        { error: '分类列表不存在' },
        { status: 404 }
      )
    }

    let categories = JSON.parse(setting.value)

    // 删除分类
    categories = categories.filter((cat: string) => cat !== name)

    // 保存到数据库
    await prisma.systemSetting.update({
      where: { key: CATEGORIES_KEY },
      data: { value: JSON.stringify(categories) }
    })

    return NextResponse.json({ 
      message: '删除成功',
      categories 
    })
  } catch (error) {
    console.error('删除分类失败:', error)
    return NextResponse.json(
      { error: '删除分类失败' },
      { status: 500 }
    )
  }
}
