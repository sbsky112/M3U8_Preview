import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始初始化数据库...')

  // 1. 检查默认管理员是否已存在
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  })

  if (existingAdmin) {
    console.log('✅ 默认管理员已存在')
    console.log(`   用户名: admin`)
    console.log(`   ID: ${existingAdmin.id}`)
  } else {
    // 创建默认管理员
    const hashedPassword = await bcrypt.hashSync('admin123', 10)
    
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: '系统管理员',
        role: 'admin',
      },
    })

    console.log('✅ 默认管理员账号已创建')
    console.log(`   用户名: admin`)
    console.log(`   密码: admin123`)
    console.log(`   ID: ${admin.id}`)
  }

  // 2. 初始化系统设置
  const defaultSettings = [
    { key: 'registration_enabled', value: 'true' },
    { key: 'site_name', value: 'M3U8 视频平台' },
    { key: 'site_description', value: '基于 Next.js 的视频管理平台' },
  ]

  for (const setting of defaultSettings) {
    const exists = await prisma.systemSetting.findUnique({
      where: { key: setting.key },
    })
    
    if (!exists) {
      await prisma.systemSetting.create({
        data: setting,
      })
      console.log(`✅ 创建系统设置: ${setting.key}`)
    }
  }

  console.log('')
  console.log('✅ 数据库初始化完成！')
  console.log('⚠️  重要提示：首次登录后请立即修改密码！')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ 初始化失败:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
