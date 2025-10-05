/**
 * 初始化视频分类数据
 * 
 * 运行方式：
 * npx tsx scripts/init-categories.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_CATEGORIES = [
  '影视',
  '动漫',
  '综艺',
  '纪录片',
  '教育',
  '音乐',
  '游戏',
  '体育',
  '科技',
  '生活',
  '美食',
  '旅游',
  '其他',
]

async function initCategories() {
  try {
    console.log('开始初始化分类数据...')

    // 检查是否已存在分类设置
    const existing = await prisma.systemSetting.findUnique({
      where: { key: 'video_categories' },
    })

    if (existing) {
      console.log('✅ 分类数据已存在，无需初始化')
      console.log('当前分类:', JSON.parse(existing.value))
      return
    }

    // 创建默认分类
    await prisma.systemSetting.create({
      data: {
        key: 'video_categories',
        value: JSON.stringify(DEFAULT_CATEGORIES),
      },
    })

    console.log('✅ 分类数据初始化成功！')
    console.log('默认分类:', DEFAULT_CATEGORIES)
  } catch (error) {
    console.error('❌ 初始化分类数据失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

initCategories()
