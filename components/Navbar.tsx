'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { hasAdminAccess } from '@/lib/permissions'
import { useState } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const isAdmin = hasAdminAccess(session?.user)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/signin')
    setMobileMenuOpen(false)
  }

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-xl sticky top-0 z-50 border-b-2 border-blue-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center space-x-2 sm:space-x-8">
            <Link href="/videos" className="flex items-center group">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 group-hover:scale-110 transition-transform drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg sm:text-2xl font-bold gradient-text">M3U8</span>
              </div>
            </Link>
            
            <div className="hidden md:flex space-x-2">
              <Link
                href="/videos"
                className="text-black hover:text-gray-900 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-transparent hover:border-blue-200"
              >
                📹 视频列表
              </Link>
              {isAdmin && (
                <>
                  <Link
                    href="/videos/upload"
                    className="text-black hover:text-gray-900 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-transparent hover:border-blue-200"
                  >
                    ⬆️ 上传视频
                  </Link>
                  <Link
                    href="/videos/batch-import"
                    className="text-black hover:text-gray-900 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-transparent hover:border-blue-200"
                  >
                    📦 批量导入
                  </Link>
                  <Link
                    href="/admin"
                    className="px-4 py-2 rounded-lg text-sm font-black transition-all flex items-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                      color: '#000000',
                      border: '2px solid rgba(59, 130, 246, 0.3)'
                    }}
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

          <div className="flex items-center space-x-2 sm:space-x-4">
            {session?.user && (
              <>
                {/* 移动端用户信息 */}
                <div className="md:hidden">
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black shadow-md"
                    style={{
                      background: 'linear-gradient(to right, #3b82f6, #2563eb)'
                    }}
                  >
                    {(session.user.name || (session.user as any).username).charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* 桌面端用户信息 */}
                <div 
                  className="hidden md:flex items-center space-x-3 px-4 py-2 rounded-lg border-2 border-blue-300 shadow-md"
                  style={{
                    background: 'linear-gradient(to right, #eff6ff, #dbeafe)'
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black shadow-md"
                    style={{
                      background: 'linear-gradient(to right, #3b82f6, #2563eb)'
                    }}
                  >
                    {(session.user.name || (session.user as any).username).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-black text-black block">
                      {session.user.name || (session.user as any).username}
                    </span>
                    {isAdmin && (
                      <span 
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black text-black shadow-sm"
                        style={{
                          background: 'linear-gradient(to right, #fbbf24, #f59e0b)'
                        }}
                      >
                        ⭐ 管理员
                      </span>
                    )}
                  </div>
                </div>

                {/* 汉堡菜单按钮 */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  aria-label="菜单"
                >
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>

                {/* 桌面端按钮 */}
                <Link
                  href="/profile/change-password"
                  className="hidden md:block text-black hover:text-gray-900 hover:bg-blue-50 px-3 py-2 rounded-lg text-lg font-bold transition-all border-2 border-blue-300 hover:border-blue-400"
                  title="修改密码"
                >
                  🔑
                </Link>
                <button
                  onClick={handleSignOut}
                  className="hidden md:block px-5 py-2 rounded-lg transition-all text-sm font-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(to right, #ef4444, #dc2626)',
                    color: '#ffffff',
                    border: '2px solid rgba(239, 68, 68, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #dc2626, #b91c1c)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #dc2626)';
                  }}
                >
                  🚪 退出登录
                </button>
              </>
            )}
          </div>
        </div>

        {/* 移动端菜单 */}
        {mobileMenuOpen && session?.user && (
          <div className="md:hidden border-t-2 border-blue-200 py-3 space-y-2">
            <div className="px-3 py-2 text-sm font-bold text-gray-600">
              用户：{session.user.name || (session.user as any).username}
              {isAdmin && <span className="ml-2 text-yellow-600">⭐ 管理员</span>}
            </div>
            
            <Link
              href="/videos"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-black hover:bg-blue-50 px-3 py-2.5 rounded-lg text-sm font-bold transition-all"
            >
              📹 视频列表
            </Link>

            {isAdmin && (
              <>
                <Link
                  href="/videos/upload"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-black hover:bg-blue-50 px-3 py-2.5 rounded-lg text-sm font-bold transition-all"
                >
                  ⬆️ 上传视频
                </Link>
                <Link
                  href="/videos/batch-import"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-black hover:bg-blue-50 px-3 py-2.5 rounded-lg text-sm font-bold transition-all"
                >
                  📦 批量导入
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-black transition-all"
                  style={{
                    background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                    color: '#000000'
                  }}
                >
                  🛡️ 管理后台
                </Link>
              </>
            )}

            <Link
              href="/profile/change-password"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-black hover:bg-blue-50 px-3 py-2.5 rounded-lg text-sm font-bold transition-all"
            >
              🔑 修改密码
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-black transition-all"
              style={{
                background: 'linear-gradient(to right, #ef4444, #dc2626)',
                color: '#ffffff'
              }}
            >
              🚪 退出登录
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
