'use client'

import { useState, useEffect } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface Backup {
  name: string
  path: string
  size: number
  createdAt: Date
}

export default function BackupManager() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')

  useEffect(() => {
    fetchBackups()
  }, [])

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const fetchBackups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/backup')
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups || [])
      } else {
        showMessage('获取备份列表失败', 'error')
      }
    } catch (error) {
      showMessage('获取备份列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async (fullBackup: boolean = false) => {
    try {
      setLoading(true)
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullBackup,
          includeFiles: fullBackup
        })
      })

      if (response.ok) {
        const data = await response.json()
        showMessage(data.message, 'success')
        fetchBackups()
      } else {
        const error = await response.json()
        showMessage(error.error || '创建备份失败', 'error')
      }
    } catch (error) {
      showMessage('创建备份失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const deleteBackup = async (backupPath: string) => {
    if (!confirm('确定要删除这个备份吗？')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/backup?path=${encodeURIComponent(backupPath)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        showMessage(data.message, 'success')
        fetchBackups()
      } else {
        const error = await response.json()
        showMessage(error.error || '删除备份失败', 'error')
      }
    } catch (error) {
      showMessage('删除备份失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const restoreBackup = async (backupPath: string) => {
    if (!confirm('确定要从这个备份恢复吗？这将覆盖当前数据！')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupPath,
          includeFiles: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        showMessage(data.message, 'success')
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        const error = await response.json()
        showMessage(error.error || '恢复备份失败', 'error')
      }
    } catch (error) {
      showMessage('恢复备份失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">备份与恢复管理</h1>

      {/* 消息提示 */}
      {message && (
        <div className={`mb-4 p-4 rounded ${
          messageType === 'success' ? 'bg-green-100 text-green-700' :
          messageType === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {message}
        </div>
      )}

      {/* 备份操作 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">创建备份</h2>
        <div className="flex gap-4">
          <button
            onClick={() => createBackup(false)}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '创建中...' : '数据库备份'}
          </button>
          <button
            onClick={() => createBackup(true)}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? '创建中...' : '完整备份'}
          </button>
        </div>
      </div>

      {/* 备份列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">备份列表</h2>
        </div>

        {loading && backups.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            加载中...
          </div>
        ) : backups.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            暂无备份文件
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    文件名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    大小
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.path}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {backup.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(backup.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(backup.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => restoreBackup(backup.path)}
                        disabled={loading}
                        className="text-green-600 hover:text-green-900 mr-3 disabled:opacity-50"
                      >
                        恢复
                      </button>
                      <button
                        onClick={() => deleteBackup(backup.path)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div className="mt-6 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">使用说明</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>数据库备份</strong>：仅备份数据库内容</li>
          <li>• <strong>完整备份</strong>：备份数据库和上传的文件</li>
          <li>• 备份文件会自动存储在服务器的 <code>data/backups</code> 目录</li>
          <li>• 恢复备份会覆盖当前所有数据，请谨慎操作</li>
          <li>• 建议定期创建备份并删除旧的备份文件</li>
        </ul>
      </div>
    </div>
  )
}