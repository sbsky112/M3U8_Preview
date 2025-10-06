import { prisma } from './prisma'
import { promises as fs } from 'fs'
import path from 'path'
import archiver from 'archiver'
import { NextResponse } from 'next/server'
import { createWriteStream } from 'fs'

export interface ZipBackupOptions {
  includeFiles?: boolean
}

export interface ZipRestoreOptions {
  includeFiles?: boolean
}

/**
 * 创建ZIP格式的完整备份
 */
export async function createZipBackup(options: ZipBackupOptions = {}): Promise<{ success: boolean; message: string; filename?: string }> {
  try {
    const { includeFiles = true } = options

    // 确保备份目录存在
    const backupDir = path.join(process.cwd(), 'data', 'backups')
    await fs.mkdir(backupDir, { recursive: true })

    // 生成备份文件名（带时间戳）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup_${timestamp}.zip`
    const backupFilePath = path.join(backupDir, filename)

    // 创建ZIP文件
    const output = createWriteStream(backupFilePath)
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最高压缩级别
    })

    // Promise来等待ZIP创建完成
    const zipPromise = new Promise<void>((resolve, reject) => {
      output.on('close', resolve)
      archive.on('error', reject)
    })

    archive.pipe(output)

    // 1. 备份数据库
    const currentDbUrl = process.env.DATABASE_URL || ''
    const currentDbPath = currentDbUrl.replace('file:', '').replace('./', '')

    if (currentDbPath && await fileExists(currentDbPath)) {
      archive.file(currentDbPath, { name: 'app.db' })
    }

    // 2. 备份系统设置（JSON格式）
    const settings = await prisma.systemSetting.findMany()
    const settingsJson = JSON.stringify(settings, null, 2)
    archive.append(settingsJson, { name: 'settings.json' })

    // 3. 备份上传的文件（如果存在）
    if (includeFiles) {
      const publicDir = path.join(process.cwd(), 'public', 'uploads')
      if (await fileExists(publicDir)) {
        archive.directory(publicDir, 'uploads')
      }
    }

    // 4. 添加备份信息文件
    const backupInfo = {
      backupDate: new Date().toISOString(),
      version: '1.0',
      includeFiles,
      totalUsers: await prisma.user.count(),
      totalVideos: await prisma.video.count(),
      appVersion: process.env.npm_package_version || 'unknown'
    }
    archive.append(JSON.stringify(backupInfo, null, 2), { name: 'backup-info.json' })

    // 完成ZIP创建
    await archive.finalize()
    await zipPromise

    return {
      success: true,
      message: `备份创建成功: ${filename}`,
      filename
    }
  } catch (error) {
    console.error('创建ZIP备份失败:', error)
    return {
      success: false,
      message: `备份失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 从ZIP文件恢复
 */
export async function restoreFromZip(zipFilePath: string, options: ZipRestoreOptions = {}): Promise<{ success: boolean; message: string }> {
  try {
    const { includeFiles = true } = options

    // 检查ZIP文件是否存在
    if (!await fileExists(zipFilePath)) {
      return {
        success: false,
        message: '备份文件不存在'
      }
    }

    // 创建临时目录用于解压
    const tempDir = path.join(process.cwd(), 'data', 'temp', `restore_${Date.now()}`)
    await fs.mkdir(tempDir, { recursive: true })

    // 解压ZIP文件
    await extractZip(zipFilePath, tempDir)

    // 1. 恢复数据库
    const dbPath = path.join(tempDir, 'app.db')
    if (await fileExists(dbPath)) {
      const currentDbUrl = process.env.DATABASE_URL || ''
      const currentDbPath = currentDbUrl.replace('file:', '').replace('./', '')

      if (currentDbPath) {
        await fs.copyFile(dbPath, currentDbPath)
      }
    }

    // 2. 恢复系统设置（如果存在）
    const settingsPath = path.join(tempDir, 'settings.json')
    if (await fileExists(settingsPath)) {
      try {
        const settingsData = await fs.readFile(settingsPath, 'utf-8')
        const settings = JSON.parse(settingsData)

        // 清除现有设置并恢复
        await prisma.systemSetting.deleteMany()
        await prisma.systemSetting.createMany({
          data: settings.map((setting: any) => ({
            key: setting.key,
            value: setting.value
          }))
        })
      } catch (error) {
        console.warn('恢复系统设置失败:', error)
      }
    }

    // 3. 恢复上传的文件（如果存在且包含文件）
    if (includeFiles) {
      const uploadsDir = path.join(tempDir, 'uploads')
      const targetDir = path.join(process.cwd(), 'public', 'uploads')

      if (await fileExists(uploadsDir)) {
        await fs.mkdir(targetDir, { recursive: true })
        await copyDirectory(uploadsDir, targetDir)
      }
    }

    // 清理临时目录
    await fs.rm(tempDir, { recursive: true, force: true })

    return {
      success: true,
      message: '网站恢复成功'
    }
  } catch (error) {
    console.error('从ZIP恢复失败:', error)
    return {
      success: false,
      message: `恢复失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 处理上传的ZIP文件并恢复
 */
export async function processUploadedZip(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const file = formData.get('backupFile') as File

    if (!file) {
      return {
        success: false,
        message: '未找到备份文件'
      }
    }

    // 检查文件类型
    if (!file.name.endsWith('.zip')) {
      return {
        success: false,
        message: '只支持ZIP格式的备份文件'
      }
    }

    // 检查文件大小（限制为50MB）
    if (file.size > 50 * 1024 * 1024) {
      return {
        success: false,
        message: '备份文件大小不能超过50MB'
      }
    }

    // 创建临时目录
    const tempDir = path.join(process.cwd(), 'data', 'temp', `upload_${Date.now()}`)
    await fs.mkdir(tempDir, { recursive: true })

    // 保存上传的文件
    const buffer = Buffer.from(await file.arrayBuffer())
    const zipPath = path.join(tempDir, file.name)
    await fs.writeFile(zipPath, buffer)

    // 执行恢复
    const result = await restoreFromZip(zipPath, { includeFiles: true })

    // 清理临时目录
    await fs.rm(tempDir, { recursive: true, force: true })

    return result
  } catch (error) {
    console.error('处理上传备份失败:', error)
    return {
      success: false,
      message: `恢复失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

// 辅助函数
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function extractZip(zipPath: string, extractDir: string): Promise<void> {
  // 这里可以使用更简单的解压方法，由于环境限制，我们使用基础实现
  const { execSync } = require('child_process')
  try {
    execSync(`unzip "${zipPath}" -d "${extractDir}"`, { stdio: 'ignore' })
  } catch (error) {
    // 如果unzip不可用，尝试其他方法
    throw new Error('解压失败，请确保系统支持ZIP解压')
  }
}

async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}