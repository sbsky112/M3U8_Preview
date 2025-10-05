/**
 * 初始化默认管理员账号
 */

import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123',
  name: '系统管理员',
  role: 'admin',
}

/**
 * 创建默认管理员账号（如果不存在）
 */
export async function initDefaultAdmin() {
  try {
    // 检查管理员是否已存在
    const existingAdmin = await prisma.user.findUnique({
      where: { username: DEFAULT_ADMIN.username },
    })

    if (existingAdmin) {
      console.log('✅ 管理员账号已存在')
      return existingAdmin
    }

    // 创建管理员账号
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10)
    
    const admin = await prisma.user.create({
      data: {
        username: DEFAULT_ADMIN.username,
        password: hashedPassword,
        name: DEFAULT_ADMIN.name,
        role: DEFAULT_ADMIN.role,
      },
    })

    console.log('✅ 默认管理员账号已创建')
    console.log(`   用户名: ${DEFAULT_ADMIN.username}`)
    console.log(`   密码: ${DEFAULT_ADMIN.password}`)
    
    return admin
  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error)
    throw error
  }
}

/**
 * 获取管理员账号
 */
export async function getAdminUser() {
  return await prisma.user.findUnique({
    where: { username: DEFAULT_ADMIN.username },
  })
}

/**
 * 检查是否是默认管理员
 */
export function isDefaultAdmin(username: string): boolean {
  return username === DEFAULT_ADMIN.username
}

/**
 * 获取默认管理员信息（不包含密码）
 */
export function getDefaultAdminInfo() {
  return {
    username: DEFAULT_ADMIN.username,
    name: DEFAULT_ADMIN.name,
  }
}
