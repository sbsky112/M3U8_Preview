import { prisma, backupPrisma } from './prisma'
import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface BackupOptions {
  includeFiles?: boolean
  backupPath?: string
}

export interface RestoreOptions {
  includeFiles?: boolean
  backupPath?: string
}

/**
 * 创建数据库备份
 */
export async function createDatabaseBackup(options: BackupOptions = {}): Promise<{ success: boolean; message: string; backupPath?: string }> {
  try {
    const { includeFiles = false, backupPath } = options

    // 确保备份目录存在
    const backupDir = backupPath || path.join(process.cwd(), 'data', 'backups')
    await fs.mkdir(backupDir, { recursive: true })

    // 生成备份文件名（带时间戳）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = `backup_${timestamp}.db`
    const backupFilePath = path.join(backupDir, backupFile)

    // 获取当前数据库文件路径
    const currentDbUrl = process.env.DATABASE_URL || ''
    const currentDbPath = currentDbUrl.replace('file:', '').replace('./', '')

    if (currentDbPath && await fileExists(currentDbPath)) {
      // 直接复制数据库文件
      await fs.copyFile(currentDbPath, backupFilePath)
    } else {
      // 如果数据库文件不存在，先创建数据库备份
      // 使用 Prisma 的 SQLite 导出功能
      const { stdout } = await execAsync(`sqlite3 "${currentDbPath}" ".backup '${backupFilePath}'"`)
    }

    // 如果需要备份文件
    if (includeFiles) {
      const filesBackupPath = path.join(backupDir, `files_${timestamp}`)
      await fs.mkdir(filesBackupPath, { recursive: true })

      // 复制上传的文件（如果有的话）
      const publicDir = path.join(process.cwd(), 'public', 'uploads')
      if (await fileExists(publicDir)) {
        await copyDirectory(publicDir, path.join(filesBackupPath, 'uploads'))
      }
    }

    return {
      success: true,
      message: `备份创建成功: ${backupFile}`,
      backupPath: backupFilePath
    }
  } catch (error) {
    console.error('创建备份失败:', error)
    return {
      success: false,
      message: `备份失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 从备份恢复数据库
 */
export async function restoreFromBackup(backupFilePath: string, options: RestoreOptions = {}): Promise<{ success: boolean; message: string }> {
  try {
    const { includeFiles = false } = options

    // 检查备份文件是否存在
    if (!await fileExists(backupFilePath)) {
      return {
        success: false,
        message: '备份文件不存在'
      }
    }

    // 获取当前数据库文件路径
    const currentDbUrl = process.env.DATABASE_URL || ''
    const currentDbPath = currentDbUrl.replace('file:', '').replace('./', '')

    if (!currentDbPath) {
      return {
        success: false,
        message: '无法确定当前数据库文件路径'
      }
    }

    // 确保数据库目录存在
    const dbDir = path.dirname(currentDbPath)
    await fs.mkdir(dbDir, { recursive: true })

    // 关闭当前数据库连接
    await prisma.$disconnect()

    // 恢复数据库文件
    await fs.copyFile(backupFilePath, currentDbPath)

    // 如果需要恢复文件
    if (includeFiles) {
      const backupDir = path.dirname(backupFilePath)
      const filesBackupName = path.basename(backupFilePath, '.db').replace('backup_', 'files_')
      const filesBackupPath = path.join(backupDir, filesBackupName)

      if (await fileExists(filesBackupPath)) {
        const publicDir = path.join(process.cwd(), 'public', 'uploads')
        await copyDirectory(path.join(filesBackupPath, 'uploads'), publicDir)
      }
    }

    return {
      success: true,
      message: '数据库恢复成功'
    }
  } catch (error) {
    console.error('恢复数据库失败:', error)
    return {
      success: false,
      message: `恢复失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 获取所有备份文件列表
 */
export async function listBackups(backupDir?: string): Promise<{ success: boolean; backups: Array<{ name: string; path: string; size: number; createdAt: Date }> }> {
  try {
    const backupsPath = backupDir || path.join(process.cwd(), 'data', 'backups')

    if (!await fileExists(backupsPath)) {
      return { success: true, backups: [] }
    }

    const files = await fs.readdir(backupsPath)
    const backupFiles = files.filter(file => file.endsWith('.db'))

    const backups = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = path.join(backupsPath, file)
        const stats = await fs.stat(filePath)

        return {
          name: file,
          path: filePath,
          size: stats.size,
          createdAt: stats.birthtime
        }
      })
    )

    // 按创建时间倒序排列
    backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return {
      success: true,
      backups
    }
  } catch (error) {
    console.error('列出备份失败:', error)
    return {
      success: false,
      backups: []
    }
  }
}

/**
 * 删除备份文件
 */
export async function deleteBackup(backupFilePath: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!await fileExists(backupFilePath)) {
      return {
        success: false,
        message: '备份文件不存在'
      }
    }

    await fs.unlink(backupFilePath)

    return {
      success: true,
      message: '备份删除成功'
    }
  } catch (error) {
    console.error('删除备份失败:', error)
    return {
      success: false,
      message: `删除失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 完整网站备份（数据库 + 文件）
 */
export async function createFullBackup(): Promise<{ success: boolean; message: string; backupPath?: string }> {
  try {
    // 创建数据库备份
    const dbBackup = await createDatabaseBackup({ includeFiles: true })

    if (!dbBackup.success) {
      return dbBackup
    }

    // 创建配置文件备份
    const backupDir = path.join(process.cwd(), 'data', 'backups')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const configBackupPath = path.join(backupDir, `config_${timestamp}.json`)

    const config = {
      backupDate: new Date().toISOString(),
      appVersion: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV,
      settings: {}
    }

    // 保存系统设置
    try {
      const settings = await prisma.systemSetting.findMany()
      config.settings = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      }, {} as Record<string, string>)
    } catch (error) {
      console.warn('无法备份系统设置:', error)
    }

    await fs.writeFile(configBackupPath, JSON.stringify(config, null, 2))

    return {
      success: true,
      message: `完整备份创建成功`,
      backupPath: dbBackup.backupPath
    }
  } catch (error) {
    console.error('创建完整备份失败:', error)
    return {
      success: false,
      message: `备份失败: ${error instanceof Error ? error.message : '未知错误'}`
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