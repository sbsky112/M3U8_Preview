/**
 * 视频信息解析工具
 * 从标题中提取作者信息
 */

/**
 * 从标题中提取作者名
 * 格式1：标题-作者名
 * 格式2：标题-[作者名]
 * @param title 原始标题
 * @returns { cleanTitle: 清理后的标题, author: 作者名 }
 */
export function parseVideoTitle(title: string): {
  cleanTitle: string
  author: string | null
} {
  // 优先匹配格式：-[作者名] 或 - [作者名]
  const bracketPattern = /-\s*\[([^\]]+)\]\s*$/
  const bracketMatch = title.match(bracketPattern)

  if (bracketMatch) {
    const author = bracketMatch[1].trim()
    const cleanTitle = title.replace(bracketPattern, '').trim()
    return {
      cleanTitle,
      author,
    }
  }

  // 如果没有方括号，匹配格式：-作者名（作者名不含特殊字符）
  const simplePattern = /-\s*([^\-\|\s]+)\s*$/
  const simpleMatch = title.match(simplePattern)

  if (simpleMatch) {
    const author = simpleMatch[1].trim()
    const cleanTitle = title.replace(simplePattern, '').trim()
    return {
      cleanTitle,
      author,
    }
  }

  return {
    cleanTitle: title,
    author: null,
  }
}

/**
 * 预定义的视频分类列表
 */
export const VIDEO_CATEGORIES = [
  '影视',
  '动漫',
  '综艺',
  '纪录片',
  '教育',
  '音乐',
  '游戏',
  '体育',
  '科技',
  '生活',
  '美食',
  '旅游',
  '其他',
] as const

export type VideoCategory = typeof VIDEO_CATEGORIES[number]
