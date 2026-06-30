export type UserRole = 'admin' | 'viewer'

export type UserStatus = 'active' | 'cancelled'

export type PostFormat = 'markdown' | 'richtext'

export type PostStatus = 'published' | 'draft'

export interface User {
  id: number
  username: string
  name: string
  role: UserRole
  status: UserStatus
  bio: string
  avatar: string
}

export interface ManagedUser extends User {
  commentCount: number
}

export interface LoginPayload {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface UsersResponse {
  items: ManagedUser[]
}

export interface UpdateUserProfilePayload {
  username: string
}

export interface UpdateUserPasswordPayload {
  password: string
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
  authorId: number | null
  author: string
  content: string
  createdAt: string
}

export interface CommentInput {
  postId: number
  content: string
}

export interface CommentsResponse {
  items: Comment[]
  total: number
}

export interface UploadResponse {
  url: string
}
