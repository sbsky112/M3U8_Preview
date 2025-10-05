'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { hasAdminAccess } from '@/lib/permissions'

export default function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const isAdmin = hasAdminAccess(session?.user)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/signin')
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/videos" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">M3U8 视频</span>
            </Link>
            
            <div className="hidden md:flex space-x-4">
              <Link
                href="/videos"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                视频列表
              </Link>
              {isAdmin && (
                <>
                  <Link
                    href="/videos/upload"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    上传视频
                  </Link>
                  <Link
                    href="/videos/batch-import"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    批量导入
                  </Link>
                  <Link
                    href="/admin"
                    className="text-purple-700 hover:text-purple-900 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    管理后台
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {session?.user && (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    {session.user.name || (session.user as any).username}
                  </span>
                  {isAdmin && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      管理员
                    </span>
                  )}
                </div>
                <Link
                  href="/profile/change-password"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  修改密码
                </Link>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  退出登录
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
