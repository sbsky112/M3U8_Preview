'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Navbar from '@/components/Navbar'
import { hasAdminAccess } from '@/lib/permissions'

export default function CategoriesManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/videos')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchCategories()
    }
  }, [status, session])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/admin/categories')
      setCategories(response.data.categories)
    } catch (error) {
      console.error('获取分类列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      alert('分类名称不能为空')
      return
    }

    if (categories.includes(newCategory.trim())) {
      alert('分类已存在')
      return
    }

    try {
      await axios.post('/api/admin/categories', {
        name: newCategory.trim()
      })
      setNewCategory('')
      fetchCategories()
      alert('添加成功')
    } catch (error: any) {
      alert(error.response?.data?.error || '添加失败')
    }
  }

  const handleUpdateCategory = async (oldName: string, newName: string) => {
    if (!newName.trim()) {
      alert('分类名称不能为空')
      return
    }

    if (newName === oldName) {
      setEditingIndex(null)
      return
    }

    if (categories.includes(newName.trim())) {
      alert('分类已存在')
      return
    }

    try {
      await axios.put('/api/admin/categories', {
        oldName,
        newName: newName.trim()
      })
      setEditingIndex(null)
      setEditingValue('')
      fetchCategories()
      alert('修改成功')
    } catch (error: any) {
      alert(error.response?.data?.error || '修改失败')
    }
  }

  const handleDeleteCategory = async (name: string) => {
    if (!confirm(`确定要删除分类"${name}"吗？\n注意：这不会影响已有视频的分类标签。`)) {
      return
    }

    try {
      await axios.delete('/api/admin/categories', {
        data: { name }
      })
      fetchCategories()
      alert('删除成功')
    } catch (error: any) {
      alert(error.response?.data?.error || '删除失败')
    }
  }

  const startEdit = (index: number, value: string) => {
    setEditingIndex(index)
    setEditingValue(value)
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditingValue('')
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">分类管理</h1>
            <p className="mt-2 text-gray-600">
              共 {categories.length} 个分类
            </p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            ← 返回后台
          </button>
        </div>

        {/* 添加分类 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">添加新分类</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="输入分类名称"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAddCategory}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              添加
            </button>
          </div>
        </div>

        {/* 分类列表 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">分类列表</h2>
          </div>
          
          {categories.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              暂无分类，请添加
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {categories.map((category, index) => (
                <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    {editingIndex === index ? (
                      <div className="flex-1 flex items-center gap-3">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateCategory(category, editingValue)
                            } else if (e.key === 'Escape') {
                              cancelEdit()
                            }
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateCategory(category, editingValue)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          保存
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(index, category)}
                            className="px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors text-sm font-medium"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors text-sm font-medium"
                          >
                            删除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 提示信息 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">提示：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>删除分类不会影响已有视频的分类标签</li>
                <li>修改分类名称后，新上传的视频可以使用新名称</li>
                <li>建议不要频繁修改分类名称，以保持分类的一致性</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
