import { NextRequest, NextResponse } from 'next/server'
import { restoreFromBackup } from '@/lib/backup-restore'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST - 从备份恢复
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    const body = await request.json()
    const { backupPath, includeFiles } = body

    if (!backupPath) {
      return NextResponse.json({ error: '缺少备份文件路径' }, { status: 400 })
    }

    const result = await restoreFromBackup(backupPath, { includeFiles })

    if (!result.success) {
      return NextResponse.json({ error: '恢复备份失败' }, { status: 500 })
    }

    return NextResponse.json({ message: '数据库恢复成功' })
  } catch (error) {
    console.error('恢复备份失败:', error)
    return NextResponse.json({ error: '恢复备份失败' }, { status: 500 })
  }
}