export interface Video {
  id: string
  title: string
  description?: string
  m3u8Url: string
  thumbnail?: string
  duration?: number
  author?: string
  category?: string
  createdAt: string
  updatedAt: string
  userId: string
  user: {
    id: string
    name: string | null
    username: string
  }
}

export interface VideoFilters {
  categories: string[]
  authors: string[]
}