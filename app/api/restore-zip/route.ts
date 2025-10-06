import { NextRequest, NextResponse } from 'next/server'
import { processUploadedZip } from '@/lib/backup-zip'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST - 从上传的ZIP文件恢复
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    // 处理multipart/form-data
    const formData = await request.formData()
    const file = formData.get('backupFile') as File

    if (!file) {
      return NextResponse.json({ error: '未找到备份文件' }, { status: 400 })
    }

    // 检查文件类型
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ error: '只支持ZIP格式的备份文件' }, { status: 400 })
    }

    // 检查文件大小（限制为50MB）
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: '备份文件大小不能超过50MB' }, { status: 400 })
    }

    // 执行恢复
    const result = await processUploadedZip(formData)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({ message: result.message })
  } catch (error) {
    console.error('恢复备份失败:', error)
    return NextResponse.json({ error: '恢复备份失败' }, { status: 500 })
  }
}