import { NextRequest, NextResponse } from 'next/server'
import { createDatabaseBackup, listBackups, deleteBackup, createFullBackup } from '@/lib/backup-restore'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - 列出所有备份
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    const result = await listBackups()

    if (!result.success) {
      return NextResponse.json({ error: '获取备份列表失败' }, { status: 500 })
    }

    return NextResponse.json({ backups: result.backups })
  } catch (error) {
    console.error('获取备份列表失败:', error)
    return NextResponse.json({ error: '获取备份列表失败' }, { status: 500 })
  }
}

// POST - 创建备份
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    const body = await request.json()
    const { includeFiles, fullBackup } = body

    let result
    if (fullBackup) {
      result = await createFullBackup()
    } else {
      result = await createDatabaseBackup({ includeFiles })
    }

    if (!result.success) {
      return NextResponse.json({ error: '创建备份失败' }, { status: 500 })
    }

    return NextResponse.json({
      message: result.message,
      backupPath: result.backupPath
    })
  } catch (error) {
    console.error('创建备份失败:', error)
    return NextResponse.json({ error: '创建备份失败' }, { status: 500 })
  }
}

// DELETE - 删除备份
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const backupPath = searchParams.get('path')

    if (!backupPath) {
      return NextResponse.json({ error: '缺少备份路径参数' }, { status: 400 })
    }

    const result = await deleteBackup(backupPath)

    if (!result.success) {
      return NextResponse.json({ error: '删除备份失败' }, { status: 500 })
    }

    return NextResponse.json({ message: '备份删除成功' })
  } catch (error) {
    console.error('删除备份失败:', error)
    return NextResponse.json({ error: '删除备份失败' }, { status: 500 })
  }
}