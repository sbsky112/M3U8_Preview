'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Navbar from '@/components/Navbar'
import { hasAdminAccess } from '@/lib/permissions'

interface Stats {
  totalUsers: number
  totalVideos: number
  adminCount: number
  userCount: number
  recentUsers: number
  recentVideos: number
}

interface Backup {
  name: string
  path: string
  size: number
  createdAt: Date
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [restoreUploading, setRestoreUploading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/videos')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchStats()
      fetchBackups()
      setLoading(false)
    } else if (status === 'loading') {
      setLoading(true)
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      setLoading(false)
    }
  }, [status, session])

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats')
      setStats(response.data)
    } catch (error) {
      console.error('获取统计信息失败:', error)
    }
  }

  const fetchBackups = async () => {
    try {
      const response = await axios.get('/api/backup')
      setBackups(response.data.backups || [])
    } catch (error) {
      console.error('获取备份列表失败:', error)
    }
  }

  const handleBackup = async () => {
    try {
      const confirmed = window.confirm('确定要创建网站完整备份吗？这将生成一个ZIP文件供下载。')
      if (!confirmed) return

      setLoading(true)

      // 创建ZIP备份
      const response = await axios.post('/api/backup-zip', { includeFiles: true })

      if (response.data.message) {
        // 触发文件下载
        const downloadUrl = '/api/backup-zip'
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = response.data.filename || 'backup.zip'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        alert(`备份创建成功！\n${response.data.message}\n\n文件已开始下载，请保存好备份文件。`)
      }
    } catch (error) {
      console.error('创建备份失败:', error)
      alert('备份失败，请检查服务器日志。')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (backupPath: string) => {
    try {
      const confirmed = window.confirm(
        '⚠️ 警告：恢复备份将覆盖当前所有数据！\n' +
        '建议先创建当前数据的备份。\n\n' +
        '确定要继续吗？'
      )
      if (!confirmed) return

      setLoading(true)
      const response = await axios.post('/api/restore', {
        backupPath,
        includeFiles: true
      })

      if (response.data.message) {
        alert(`恢复成功！\n${response.data.message}\n\n页面将重新加载以显示最新数据。`)
        window.location.reload()
      }
    } catch (error) {
      console.error('恢复备份失败:', error)
      alert('恢复失败，请检查服务器日志。')
    } finally {
      setLoading(false)
    }
  }

  const handleZipRestore = async () => {
    if (!restoreFile) {
      alert('请先选择备份文件')
      return
    }

    try {
      const confirmed = window.confirm(
        '⚠️ 警告：恢复备份将覆盖当前所有数据！\n' +
        '建议先创建当前数据的备份。\n\n' +
        '确定要继续吗？'
      )
      if (!confirmed) return

      setRestoreUploading(true)

      const formData = new FormData()
      formData.append('backupFile', restoreFile)

      const response = await axios.post('/api/restore-zip', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.message) {
        alert(`恢复成功！\n${response.data.message}\n\n页面将重新加载以显示最新数据。`)
        window.location.reload()
      }
    } catch (error) {
      console.error('恢复备份失败:', error)
      alert('恢复失败，请检查服务器日志。')
    } finally {
      setRestoreUploading(false)
      setShowRestoreDialog(false)
      setRestoreFile(null)
    }
  }

  const handleDeleteBackup = async (backupPath: string) => {
    try {
      const confirmed = window.confirm('确定要删除这个备份吗？此操作不可撤销。')
      if (!confirmed) return

      setLoading(true)
      await axios.delete(`/api/backup?path=${encodeURIComponent(backupPath)}`)

      alert('备份删除成功')
      fetchBackups() // 刷新备份列表
    } catch (error) {
      console.error('删除备份失败:', error)
      alert('删除备份失败，请检查服务器日志。')
    } finally {
      setLoading(false)
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">管理员后台</h1>
          <p className="mt-2 text-gray-600">
            系统管理和统计信息
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总用户数</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  最近7天: +{stats?.recentUsers || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总视频数</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalVideos || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  最近7天: +{stats?.recentVideos || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">管理员</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.adminCount || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  普通用户: {stats?.userCount || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">快速操作</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/users')}
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">用户管理</p>
                <p className="text-sm text-gray-600">管理所有用户和权限</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/videos')}
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">视频批量管理</p>
                <p className="text-sm text-gray-600">批量管理所有视频</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/categories')}
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">分类管理</p>
                <p className="text-sm text-gray-600">管理视频分类标签</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/settings')}
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">系统设置</p>
                <p className="text-sm text-gray-600">配置系统参数</p>
              </div>
            </button>

            <button
              onClick={handleBackup}
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">备份网站</p>
                <p className="text-sm text-gray-600">创建完整网站备份</p>
              </div>
            </button>

            <button
              onClick={() => setShowRestoreDialog(true)}
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">恢复网站</p>
                <p className="text-sm text-gray-600">从备份恢复网站</p>
              </div>
            </button>
          </div>
        </div>

        {/* 备份管理 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">备份与恢复</h2>
            <button
              onClick={handleBackup}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
              </svg>
              下载备份
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 备份说明 */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">网站备份</h3>
                  <p className="text-sm text-gray-600">创建完整备份并下载到本地</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>• 包含所有用户数据</p>
                <p>• 包含所有视频信息</p>
                <p>• 包含系统设置</p>
                <p>• 包含上传的文件</p>
                <p>• 生成ZIP压缩包</p>
                <p>• 自动下载到本地</p>
              </div>

              <button
                onClick={handleBackup}
                className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                立即备份
              </button>
            </div>

            {/* 恢复说明 */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">网站恢复</h3>
                  <p className="text-sm text-gray-600">从ZIP备份文件恢复网站</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>• 支持ZIP格式备份</p>
                <p>• 自动验证文件完整性</p>
                <p>• 恢复所有数据</p>
                <p>• 恢复系统设置</p>
                <p>• 恢复上传文件</p>
                <p>• ⚠️ 将覆盖当前数据</p>
              </div>

              <button
                onClick={() => setShowRestoreDialog(true)}
                className="mt-4 w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                上传恢复
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">备份建议</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>• 定期备份网站数据，建议每周至少一次</p>
                  <p>• 在进行重大操作前先备份</p>
                  <p>• 将备份文件保存在安全的地方</p>
                  <p>• 恢复前请确保备份文件完整且来源可靠</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 恢复对话框 */}
        {showRestoreDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">从备份文件恢复</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择备份文件 (ZIP格式)
                </label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {restoreFile && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">
                    已选择文件: {restoreFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    大小: {(restoreFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800">
                  ⚠️ 恢复将覆盖当前所有数据，请确认备份文件正确无误！
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRestoreDialog(false)
                    setRestoreFile(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={restoreUploading}
                >
                  取消
                </button>
                <button
                  onClick={handleZipRestore}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
                  disabled={restoreUploading || !restoreFile}
                >
                  {restoreUploading ? '恢复中...' : '确认恢复'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
