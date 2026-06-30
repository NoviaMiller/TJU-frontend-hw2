import type {
  AuthResponse,
  Comment,
  CommentInput,
  CommentsResponse,
  CreateUserPayload,
  LoginPayload,
  ManagedUser,
  Post,
  PostInput,
  PostsListResponse,
  PostsQuery,
  UpdateUserPasswordPayload,
  UpdateUserProfilePayload,
  UploadResponse,
  User,
  UsersResponse,
} from '@/types'

import { http } from '@/api/http'

export async function login(payload: LoginPayload) {
  const { data } = await http.post<AuthResponse>('/login', payload)
  return data
}

export async function getCurrentUser() {
  const { data } = await http.get<User>('/user')
  return data
}

export async function getPosts(query: PostsQuery = {}) {
  const { data } = await http.get<PostsListResponse>('/posts', {
    params: query,
  })

  return data
}

export async function getPost(id: number) {
  const { data } = await http.get<Post>(`/posts/${id}`)
  return data
}

export async function createPost(payload: PostInput) {
  const { data } = await http.post<Post>('/posts', payload)
  return data
}

export async function updatePost(id: number, payload: PostInput) {
  const { data } = await http.put<Post>(`/posts/${id}`, payload)
  return data
}

export async function deletePost(id: number) {
  const { data } = await http.delete<{ success: boolean }>(`/posts/${id}`)
  return data
}

export async function getComments(postId: number) {
  const { data } = await http.get<CommentsResponse>('/comments', {
    params: { postId },
  })

  return data
}

export async function createComment(payload: CommentInput) {
  const { data } = await http.post<Comment>('/comments', payload)
  return data
}

export async function getUsers() {
  const { data } = await http.get<UsersResponse>('/users')
  return data
}

export async function createUser(payload: CreateUserPayload) {
  const { data } = await http.post<ManagedUser>('/users', payload)
  return data
}

export async function updateUserProfile(id: number, payload: UpdateUserProfilePayload) {
  const { data } = await http.put<ManagedUser>(`/users/${id}`, payload)
  return data
}

export async function updateUserPassword(id: number, payload: UpdateUserPasswordPayload) {
  const { data } = await http.patch<ManagedUser>(`/users/${id}/password`, payload)
  return data
}

export async function cancelUser(id: number) {
  const { data } = await http.patch<ManagedUser>(`/users/${id}/cancel`)
  return data
}

export async function uploadCover(payload: { filename: string; dataUrl: string }) {
  const { data } = await http.post<UploadResponse>('/upload', payload)
  return data
}
