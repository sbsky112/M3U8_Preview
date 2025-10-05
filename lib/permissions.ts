/**
 * 权限管理工具
 */

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

/**
 * 检查用户是否是管理员
 */
export function isAdmin(role?: string): boolean {
  return role === UserRole.ADMIN
}

/**
 * 检查用户是否有管理员权限
 */
export function hasAdminAccess(user: any): boolean {
  return user && isAdmin(user.role)
}

/**
 * 检查用户是否可以编辑视频
 * 管理员可以编辑所有视频，普通用户只能编辑自己的视频
 */
export function canEditVideo(user: any, videoUserId: string): boolean {
  if (!user) return false
  return isAdmin(user.role) || user.id === videoUserId
}

/**
 * 检查用户是否可以删除视频
 * 管理员可以删除所有视频，普通用户只能删除自己的视频
 */
export function canDeleteVideo(user: any, videoUserId: string): boolean {
  if (!user) return false
  return isAdmin(user.role) || user.id === videoUserId
}

/**
 * 权限错误类
 */
export class PermissionError extends Error {
  constructor(message: string = '无权限执行此操作') {
    super(message)
    this.name = 'PermissionError'
  }
}
