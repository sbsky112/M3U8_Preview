import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['info', 'warn', 'error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'file:/app/data/app.db'
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 创建备份客户端连接
const globalForBackupPrisma = globalThis as unknown as { backupPrisma?: PrismaClient }

export const backupPrisma =
  globalForBackupPrisma.backupPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForBackupPrisma.backupPrisma = backupPrisma
