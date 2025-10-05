/**
 * 系统设置管理
 */

import { prisma } from './prisma'

export enum SystemSettingKey {
  REGISTRATION_ENABLED = 'registration_enabled',
  SITE_NAME = 'site_name',
  SITE_DESCRIPTION = 'site_description',
}

/**
 * 获取系统设置
 */
export async function getSystemSetting(key: SystemSettingKey): Promise<string | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    })
    return setting?.value || null
  } catch (error) {
    console.error(`获取系统设置失败 (${key}):`, error)
    return null
  }
}

/**
 * 设置系统配置
 */
export async function setSystemSetting(key: SystemSettingKey, value: string): Promise<boolean> {
  try {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
    return true
  } catch (error) {
    console.error(`设置系统配置失败 (${key}):`, error)
    return false
  }
}

/**
 * 检查注册是否开启
 */
export async function isRegistrationEnabled(): Promise<boolean> {
  const value = await getSystemSetting(SystemSettingKey.REGISTRATION_ENABLED)
  // 默认开启注册
  return value === null || value === 'true'
}

/**
 * 获取所有系统设置
 */
export async function getAllSystemSettings() {
  try {
    const settings = await prisma.systemSetting.findMany()
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)
  } catch (error) {
    console.error('获取所有系统设置失败:', error)
    return {}
  }
}

/**
 * 初始化默认系统设置
 */
export async function initDefaultSettings() {
  const defaults = [
    { key: SystemSettingKey.REGISTRATION_ENABLED, value: 'true' },
    { key: SystemSettingKey.SITE_NAME, value: 'M3U8 视频平台' },
    { key: SystemSettingKey.SITE_DESCRIPTION, value: '基于 Next.js 的视频管理平台' },
  ]

  for (const setting of defaults) {
    const exists = await prisma.systemSetting.findUnique({
      where: { key: setting.key },
    })
    
    if (!exists) {
      await prisma.systemSetting.create({
        data: setting,
      })
    }
  }
}
