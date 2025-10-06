import { NextRequest, NextResponse } from 'next/server'
import { createZipBackup } from '@/lib/backup-zip'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

// GET - 下载ZIP备份文件
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    // 创建ZIP备份
    const result = await createZipBackup({ includeFiles: true })

    if (!result.success || !result.filename) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    // 读取ZIP文件
    const backupDir = path.join(process.cwd(), 'data', 'backups')
    const filePath = path.join(backupDir, result.filename)
    const fileBuffer = await fs.readFile(filePath)

    // 设置响应头
    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set('Content-Disposition', `attachment; filename="${result.filename}"`)
    headers.set('Content-Length', fileBuffer.length.toString())

    // 转换为Uint8Array
    const uint8Array = new Uint8Array(fileBuffer)

    return new NextResponse(uint8Array, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('下载备份失败:', error)
    return NextResponse.json({ error: '下载备份失败' }, { status: 500 })
  }
}

// POST - 创建ZIP备份（不下载）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    const body = await request.json()
    const { includeFiles = true } = body

    // 创建ZIP备份
    const result = await createZipBackup({ includeFiles })

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({
      message: result.message,
      filename: result.filename
    })
  } catch (error) {
    console.error('创建备份失败:', error)
    return NextResponse.json({ error: '创建备份失败' }, { status: 500 })
  }
}