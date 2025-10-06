import { Prisma } from '@prisma/client'

export interface VideoSearchParams {
  search?: string
  exactMatch?: boolean
  category?: string
  author?: string
  startDate?: string
  endDate?: string
  page: number
  limit: number
}

export interface VideoSearchResult {
  videos: any[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function buildVideoWhereClause(params: Pick<VideoSearchParams, 'search' | 'exactMatch' | 'category' | 'author' | 'startDate' | 'endDate'>): Prisma.VideoWhereInput {
  const where: Prisma.VideoWhereInput = {}

  // 标题搜索
  if (params.search && params.search.trim()) {
    const searchTerm = params.search.trim()
    if (params.exactMatch) {
      where.title = {
        equals: searchTerm,
      }
    } else {
      where.title = {
        contains: searchTerm,
      }
    }
  }

  // 分类筛选
  if (params.category && params.category.trim()) {
    where.category = {
      equals: params.category.trim(),
    }
  }

  // 作者筛选
  if (params.author && params.author.trim()) {
    where.author = {
      equals: params.author.trim(),
    }
  }

  // 时间区间筛选
  if (params.startDate || params.endDate) {
    where.createdAt = {}

    if (params.startDate) {
      const start = new Date(params.startDate)
      if (!isNaN(start.getTime())) {
        where.createdAt.gte = start
      }
    }

    if (params.endDate) {
      const end = new Date(params.endDate)
      if (!isNaN(end.getTime())) {
        // 设置为当天的结束时间
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }
  }

  return where
}

export function validateSearchParams(params: Partial<VideoSearchParams>): {
  isValid: boolean
  errors: string[]
  sanitized: VideoSearchParams
} {
  const errors: string[] = []
  const sanitized: VideoSearchParams = {
    page: 1,
    limit: 20,
    ...params
  }

  // 验证页码
  if (params.page !== undefined) {
    const pageNum = parseInt(params.page.toString())
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('页码必须是大于0的整数')
      sanitized.page = 1
    } else {
      sanitized.page = pageNum
    }
  }

  // 验证每页数量
  if (params.limit !== undefined) {
    const limitNum = parseInt(params.limit.toString())
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('每页数量必须是1-100之间的整数')
      sanitized.limit = 20
    } else {
      sanitized.limit = limitNum
    }
  }

  // 验证日期格式
  if (params.startDate) {
    const start = new Date(params.startDate)
    if (isNaN(start.getTime())) {
      errors.push('开始日期格式无效')
      sanitized.startDate = undefined
    }
  }

  if (params.endDate) {
    const end = new Date(params.endDate)
    if (isNaN(end.getTime())) {
      errors.push('结束日期格式无效')
      sanitized.endDate = undefined
    }
  }

  // 验证日期范围
  if (sanitized.startDate && sanitized.endDate) {
    const start = new Date(sanitized.startDate)
    const end = new Date(sanitized.endDate)
    if (start > end) {
      errors.push('开始日期不能晚于结束日期')
      // 交换日期
      sanitized.startDate = params.endDate
      sanitized.endDate = params.startDate
    }
  }

  // 清理字符串参数
  if (params.search) {
    sanitized.search = params.search.trim()
  }
  if (params.category) {
    sanitized.category = params.category.trim()
  }
  if (params.author) {
    sanitized.author = params.author.trim()
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}