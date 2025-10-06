import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasAdminAccess } from '@/lib/permissions'
import { getAllSystemSettings, setSystemSetting, SystemSettingKey } from '@/lib/system-settings'
import { z } from 'zod'

// 强制动态渲染
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const updateSettingsSchema = z.object({
  registration_enabled: z.string().optional(),
  site_name: z.string().optional(),
  site_description: z.string().optional(),
})

// 获取系统设置
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const settings = await getAllSystemSettings()

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('获取系统设置失败:', error)
    return NextResponse.json(
      { error: '获取系统设置失败' },
      { status: 500 }
    )
  }
}

// 更新系统设置
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateSettingsSchema.parse(body)

    // 更新每个设置
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        await setSystemSetting(key as SystemSettingKey, value)
      }
    }

    const settings = await getAllSystemSettings()

    return NextResponse.json({ 
      message: '设置更新成功',
      settings 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('更新系统设置失败:', error)
    return NextResponse.json(
      { error: '更新系统设置失败' },
      { status: 500 }
    )
  }
}
