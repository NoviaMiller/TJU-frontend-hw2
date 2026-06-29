export type UserRole = 'admin' | 'viewer'

export type PostFormat = 'markdown' | 'richtext'

export type PostStatus = 'published' | 'draft'

export interface User {
  id: number
  username: string
  name: string
  role: UserRole
  bio: string
  avatar: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Post {
  id: number
  title: string
  summary: string
  content: string
  format: PostFormat
  category: string
  tags: string[]
  coverImage: string
  authorName: string
  status: PostStatus
  pinned: boolean
  views: number
  createdAt: string
  updatedAt: string
}

export interface PostInput {
  title: string
  summary: string
  content: string
  format: PostFormat
  category: string
  tags: string[]
  coverImage: string
  status: PostStatus
  pinned: boolean
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PostsQuery {
  page?: number
  pageSize?: number
  q?: string
  category?: string
  includeDrafts?: boolean
}

export interface PostsListResponse {
  items: Post[]
  categories: string[]
  pagination: PaginationMeta
}

export interface Comment {
  id: number
  postId: number
  author: string
  content: string
  createdAt: string
}

export interface CommentInput {
  postId: number
  author: string
  content: string
}

export interface CommentsResponse {
  items: Comment[]
  total: number
}

export interface UploadResponse {
  url: string
}
