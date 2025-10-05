'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Navbar from '@/components/Navbar'
import { hasAdminAccess } from '@/lib/permissions'

export default function SystemSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState({
    registration_enabled: 'true',
    site_name: '',
    site_description: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      if (!hasAdminAccess(session.user)) {
        router.push('/videos')
      } else {
        fetchSettings()
      }
    }
  }, [status, session, router])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/admin/settings')
      setSettings(response.data.settings)
    } catch (error: any) {
      console.error('获取设置失败:', error)
      setMessage('获取设置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setSettings({
      ...settings,
      [key]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    try {
      setSaving(true)
      await axios.put('/api/admin/settings', settings)
      setMessage('设置保存成功！')
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage(error.response?.data?.error || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
          <p className="mt-2 text-gray-600">
            管理系统配置和功能开关
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div className={`px-4 py-3 rounded-lg ${
                message.includes('成功') 
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message}
              </div>
            )}

            {/* 注册功能开关 */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">用户注册</h2>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    允许新用户注册
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    关闭后，新用户将无法注册账号
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleChange(
                    'registration_enabled', 
                    settings.registration_enabled === 'true' ? 'false' : 'true'
                  )}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.registration_enabled === 'true' 
                      ? 'bg-blue-600' 
                      : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.registration_enabled === 'true' 
                        ? 'translate-x-6' 
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {settings.registration_enabled === 'false' && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">注册已关闭</p>
                      <p>新用户将无法通过注册页面创建账号。管理员仍可登录。</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 站点信息 */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">站点信息</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="site_name" className="block text-sm font-medium text-gray-700 mb-2">
                    站点名称
                  </label>
                  <input
                    id="site_name"
                    type="text"
                    value={settings.site_name}
                    onChange={(e) => handleChange('site_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="M3U8 视频平台"
                  />
                </div>

                <div>
                  <label htmlFor="site_description" className="block text-sm font-medium text-gray-700 mb-2">
                    站点描述
                  </label>
                  <textarea
                    id="site_description"
                    value={settings.site_description}
                    onChange={(e) => handleChange('site_description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="基于 Next.js 的视频管理平台"
                  />
                </div>
              </div>
            </div>

            {/* 保存按钮 */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存设置'}
              </button>
            </div>
          </form>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">设置说明</p>
              <ul className="list-disc list-inside space-y-1">
                <li>关闭注册后，现有用户不受影响</li>
                <li>管理员账号始终可以登录</li>
                <li>设置立即生效，无需重启</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
