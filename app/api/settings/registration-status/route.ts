import { NextResponse } from 'next/server'
import { isRegistrationEnabled } from '@/lib/system-settings'

// 强制动态渲染
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 获取注册状态（公开接口）
export async function GET(request: Request) {
  try {
    const enabled = await isRegistrationEnabled()
    
    return NextResponse.json({ 
      registrationEnabled: enabled 
    })
  } catch (error) {
    console.error('获取注册状态失败:', error)
    return NextResponse.json(
      { error: '获取注册状态失败' },
      { status: 500 }
    )
  }
}
