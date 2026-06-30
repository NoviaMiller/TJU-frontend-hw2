import type {
  AxiosError,
  AxiosAdapter,
  AxiosHeaders,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

import { createInitialDatabase, type MockDatabase } from '@/mocks/mockData'
import type {
  AuthResponse,
  CommentInput,
  CommentsResponse,
  CreateUserPayload,
  LoginPayload,
  ManagedUser,
  Post,
  PostInput,
  PostsListResponse,
  UpdateUserPasswordPayload,
  UpdateUserProfilePayload,
  UploadResponse,
  User,
  UsersResponse,
} from '@/types'
import { AxiosError as AxiosErrorCtor } from 'axios'

const DB_KEY = 'wiki-system-mock-db-v2'
const TOKEN_PREFIX = 'mock-jwt'

let memoryDatabase = createInitialDatabase()

function cloneDatabase(database: MockDatabase): MockDatabase {
  return JSON.parse(JSON.stringify(database)) as MockDatabase
}

function hasWindow() {
  return typeof window !== 'undefined'
}

function normalizeDatabase(database: Partial<MockDatabase> | null | undefined): MockDatabase {
  const initialDatabase = createInitialDatabase()
  const storedUsers = Array.isArray(database?.users) ? database.users : []
  const nextUsers: MockDatabase['users'] = storedUsers.map((user) => ({
    ...user,
    status: user.status === 'cancelled' ? 'cancelled' : 'active',
  }))

  for (const initialUser of initialDatabase.users) {
    if (!nextUsers.some((user) => user.id === initialUser.id)) {
      nextUsers.push(initialUser)
    }
  }

  const posts = Array.isArray(database?.posts) ? database.posts : initialDatabase.posts
  const commentsSource = Array.isArray(database?.comments) ? database.comments : initialDatabase.comments
  const comments = commentsSource.map((comment) => ({
    ...comment,
    authorId: typeof comment.authorId === 'number' ? comment.authorId : null,
  }))
  const nextPostId =
    typeof database?.nextPostId === 'number'
      ? database.nextPostId
      : Math.max(0, ...posts.map((post) => post.id)) + 1
  const nextCommentId =
    typeof database?.nextCommentId === 'number'
      ? database.nextCommentId
      : Math.max(0, ...comments.map((comment) => comment.id)) + 1
  const nextUserId =
    typeof database?.nextUserId === 'number'
      ? database.nextUserId
      : Math.max(0, ...nextUsers.map((user) => user.id)) + 1

  return {
    posts,
    comments,
    users: nextUsers,
    nextPostId,
    nextCommentId,
    nextUserId,
  }
}

function loadDatabase() {
  if (!hasWindow()) {
    memoryDatabase = normalizeDatabase(memoryDatabase)
    return cloneDatabase(memoryDatabase)
  }

  const raw = window.localStorage.getItem(DB_KEY)

  if (!raw) {
    const initial = createInitialDatabase()
    window.localStorage.setItem(DB_KEY, JSON.stringify(initial))
    memoryDatabase = cloneDatabase(initial)
    return cloneDatabase(initial)
  }

  const parsed = JSON.parse(raw) as Partial<MockDatabase>
  const normalized = normalizeDatabase(parsed)
  memoryDatabase = cloneDatabase(normalized)
  window.localStorage.setItem(DB_KEY, JSON.stringify(normalized))
  return normalized
}

function saveDatabase(database: MockDatabase) {
  memoryDatabase = cloneDatabase(database)

  if (hasWindow()) {
    window.localStorage.setItem(DB_KEY, JSON.stringify(database))
  }
}

function delay(ms = 220) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}

function parseData<T>(config: AxiosRequestConfig) {
  if (!config.data) {
    return {} as T
  }

  if (typeof config.data === 'string') {
    return JSON.parse(config.data) as T
  }

  return config.data as T
}

function readHeader(headers: AxiosHeaders | Record<string, unknown> | undefined, key: string) {
  if (!headers) {
    return undefined
  }

  if ('get' in headers && typeof headers.get === 'function') {
    return headers.get(key) ?? headers.get(key.toLowerCase())
  }

  const value = headers[key] ?? headers[key.toLowerCase()]
  return typeof value === 'string' ? value : undefined
}

function makeToken(user: User) {
  const payload = JSON.stringify({
    sub: user.id,
    role: user.role,
    username: user.username,
    at: Date.now(),
  })

  return `${TOKEN_PREFIX}.${btoa(unescape(encodeURIComponent(payload)))}`
}

function parseToken(token: string | undefined) {
  if (!token?.startsWith(`${TOKEN_PREFIX}.`)) {
    return null
  }

  const payload = token.replace(`${TOKEN_PREFIX}.`, '')

  try {
    const decoded = decodeURIComponent(escape(atob(payload)))
    return JSON.parse(decoded) as { sub: number; role: User['role']; username: string }
  } catch {
    return null
  }
}

function getCurrentUser(config: AxiosRequestConfig, database: MockDatabase) {
  const authHeader = readHeader(config.headers, 'Authorization')
  const token = authHeader?.replace('Bearer ', '')
  const payload = parseToken(token)

  if (!payload) {
    return null
  }

  const user = database.users.find((item) => item.id === payload.sub) ?? null
  return user?.status === 'active' ? user : null
}

function sanitizeUser(user: MockDatabase['users'][number]): User {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    status: user.status,
    bio: user.bio,
    avatar: user.avatar,
  }
}

function makeManagedUser(
  user: MockDatabase['users'][number],
  database: MockDatabase,
): ManagedUser {
  return {
    ...sanitizeUser(user),
    commentCount: database.comments.filter((comment) => comment.authorId === user.id).length,
  }
}

function sortPosts(posts: Post[]) {
  return [...posts].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return Number(b.pinned) - Number(a.pinned)
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

function normalizePostInput(payload: PostInput) {
  return {
    title: payload.title.trim(),
    summary: payload.summary.trim(),
    content: payload.content.trim(),
    format: payload.format,
    category: payload.category.trim(),
    tags: payload.tags.map((tag) => tag.trim()).filter(Boolean),
    coverImage: payload.coverImage.trim(),
    status: payload.status,
    pinned: payload.pinned,
  }
}

function requireAdmin(currentUser: MockDatabase['users'][number] | null) {
  return currentUser?.role === 'admin'
}

function isAdminUser(
  currentUser: MockDatabase['users'][number] | null,
): currentUser is MockDatabase['users'][number] & { role: 'admin' } {
  return currentUser?.role === 'admin'
}

function validateUsername(
  username: string,
  database: MockDatabase,
  currentUserId?: number,
) {
  const normalizedUsername = username.trim()

  if (!normalizedUsername) {
    return '用户名不能为空'
  }

  if (normalizedUsername.length < 3) {
    return '用户名至少需要 3 个字符'
  }

  const duplicatedUser = database.users.find(
    (item) =>
      item.id !== currentUserId &&
      item.username.toLowerCase() === normalizedUsername.toLowerCase(),
  )

  if (duplicatedUser) {
    return '用户名已存在，请更换一个新的用户名'
  }

  return ''
}

function validatePassword(password: string) {
  if (!password.trim()) {
    return '密码不能为空'
  }

  if (password.trim().length < 6) {
    return '密码至少需要 6 位'
  }

  return ''
}

function validateDisplayName(name: string) {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return '显示名不能为空'
  }

  if (normalizedName.length < 2) {
    return '显示名至少需要 2 个字符'
  }

  return ''
}

function normalizeBio(bio: string) {
  return bio.trim()
}

function makeResponse<T>(
  config: InternalAxiosRequestConfig,
  status: number,
  data: T,
): AxiosResponse<T> {
  const statusText =
    status === 200
      ? 'OK'
      : status === 201
        ? 'Created'
        : status === 400
          ? 'Bad Request'
        : status === 401
          ? 'Unauthorized'
          : status === 403
            ? 'Forbidden'
            : status === 409
              ? 'Conflict'
            : status === 404
              ? 'Not Found'
              : 'Error'

  return {
    config,
    status,
    statusText,
    data,
    headers: {},
  }
}

export const mockAdapter: AxiosAdapter = async (config) => {
  await delay()

  const database = loadDatabase()
  const url = new URL(config.url ?? '/', 'http://mock.local')
  const method = (config.method ?? 'get').toLowerCase()
  const params = {
    ...Object.fromEntries(url.searchParams.entries()),
    ...(config.params as Record<string, string | number | boolean | undefined> | undefined),
  }

  if (method === 'post' && url.pathname === '/login') {
    const payload = parseData<LoginPayload>(config)
    const user = database.users.find(
      (item) => item.username === payload.username && item.password === payload.password,
    )

    if (!user) {
      return settleResponse(config, makeResponse(config, 401, { message: '用户名或密码错误' }))
    }

    if (user.status !== 'active') {
      return settleResponse(config, makeResponse(config, 403, { message: '该账号已注销，无法继续登录' }))
    }

    const authResponse: AuthResponse = {
      token: makeToken(user),
      user: sanitizeUser(user),
    }

    return settleResponse(config, makeResponse(config, 200, authResponse))
  }

  if (method === 'get' && url.pathname === '/user') {
    const currentUser = getCurrentUser(config, database)

    if (!currentUser) {
      return settleResponse(config, makeResponse(config, 401, { message: '登录已失效' }))
    }

    return settleResponse(config, makeResponse(config, 200, sanitizeUser(currentUser)))
  }

  if (method === 'get' && url.pathname === '/posts') {
    const currentUser = getCurrentUser(config, database)
    const includeDrafts = params.includeDrafts === true || params.includeDrafts === 'true'
    const page = Number(params.page ?? 1)
    const pageSize = Number(params.pageSize ?? 6)
    const query = `${params.q ?? ''}`.trim().toLowerCase()
    const category = `${params.category ?? ''}`.trim()

    const canSeeDrafts = includeDrafts && currentUser?.role === 'admin'
    const visiblePosts = sortPosts(database.posts).filter((post) => {
      if (!canSeeDrafts && post.status !== 'published') {
        return false
      }

      const matchedCategory = !category || category === '全部' || post.category === category
      const haystack = [post.title, post.summary, post.content, post.category, post.tags.join(' ')]
        .join(' ')
        .toLowerCase()
      const matchedQuery = !query || haystack.includes(query)

      return matchedCategory && matchedQuery
    })

    const startIndex = (page - 1) * pageSize
    const items = visiblePosts.slice(startIndex, startIndex + pageSize)
    const categories = Array.from(
      new Set(
        database.posts
          .filter((post) => (canSeeDrafts ? true : post.status === 'published'))
          .map((post) => post.category),
      ),
    )

    const postsResponse: PostsListResponse = {
      items,
      categories,
      pagination: {
        page,
        pageSize,
        total: visiblePosts.length,
        totalPages: Math.max(1, Math.ceil(visiblePosts.length / pageSize)),
      },
    }

    return settleResponse(config, makeResponse(config, 200, postsResponse))
  }

  const postMatch = url.pathname.match(/^\/posts\/(\d+)$/)

  if (method === 'get' && postMatch) {
    const currentUser = getCurrentUser(config, database)
    const postId = Number(postMatch[1])
    const post = database.posts.find((item) => item.id === postId)

    if (!post) {
      return settleResponse(config, makeResponse(config, 404, { message: '文章不存在' }))
    }

    if (post.status === 'draft' && currentUser?.role !== 'admin') {
      return settleResponse(config, makeResponse(config, 403, { message: '无权查看草稿' }))
    }

    post.views += 1
    saveDatabase(database)

    return settleResponse(config, makeResponse(config, 200, post))
  }

  if (method === 'post' && url.pathname === '/posts') {
    const currentUser = getCurrentUser(config, database)

    if (!isAdminUser(currentUser)) {
      return settleResponse(config, makeResponse(config, 401, { message: '仅管理员可发布文章' }))
    }

    const payload = normalizePostInput(parseData<PostInput>(config))
    const now = new Date().toISOString()
    const post: Post = {
      id: database.nextPostId,
      authorName: currentUser.name,
      views: 0,
      createdAt: now,
      updatedAt: now,
      ...payload,
    }

    database.posts.unshift(post)
    database.nextPostId += 1
    saveDatabase(database)

    return settleResponse(config, makeResponse(config, 201, post))
  }

  if (method === 'put' && postMatch) {
    const currentUser = getCurrentUser(config, database)

    if (!isAdminUser(currentUser)) {
      return settleResponse(config, makeResponse(config, 401, { message: '仅管理员可编辑文章' }))
    }

    const postId = Number(postMatch[1])
    const target = database.posts.find((item) => item.id === postId)

    if (!target) {
      return settleResponse(config, makeResponse(config, 404, { message: '文章不存在' }))
    }

    const payload = normalizePostInput(parseData<PostInput>(config))

    Object.assign(target, payload, {
      updatedAt: new Date().toISOString(),
      authorName: currentUser.name,
    })

    saveDatabase(database)
    return settleResponse(config, makeResponse(config, 200, target))
  }

  if (method === 'delete' && postMatch) {
    const currentUser = getCurrentUser(config, database)

    if (!requireAdmin(currentUser)) {
      return settleResponse(config, makeResponse(config, 401, { message: '仅管理员可删除文章' }))
    }

    const postId = Number(postMatch[1])
    const nextPosts = database.posts.filter((item) => item.id !== postId)

    if (nextPosts.length === database.posts.length) {
      return settleResponse(config, makeResponse(config, 404, { message: '文章不存在' }))
    }

    database.posts = nextPosts
    database.comments = database.comments.filter((item) => item.postId !== postId)
    saveDatabase(database)

    return settleResponse(config, makeResponse(config, 200, { success: true }))
  }

  if (method === 'get' && url.pathname === '/comments') {
    const postId = Number(params.postId ?? 0)
    const items = [...database.comments]
      .filter((item) => item.postId === postId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const commentsResponse: CommentsResponse = {
      items,
      total: items.length,
    }

    return settleResponse(config, makeResponse(config, 200, commentsResponse))
  }

  if (method === 'post' && url.pathname === '/comments') {
    const currentUser = getCurrentUser(config, database)
    const payload = parseData<CommentInput>(config)

    if (!currentUser) {
      return settleResponse(config, makeResponse(config, 401, { message: '请先登录后再发表评论' }))
    }

    if (!payload.content.trim()) {
      return settleResponse(config, makeResponse(config, 400, { message: '评论内容不能为空' }))
    }

    const target = database.posts.find((item) => item.id === payload.postId && item.status === 'published')

    if (!target) {
      return settleResponse(config, makeResponse(config, 404, { message: '文章不存在或不可评论' }))
    }

    const comment = {
      id: database.nextCommentId,
      postId: payload.postId,
      authorId: currentUser.id,
      author: currentUser.name,
      content: payload.content.trim(),
      createdAt: new Date().toISOString(),
    }

    database.comments.unshift(comment)
    database.nextCommentId += 1
    saveDatabase(database)

    return settleResponse(config, makeResponse(config, 201, comment))
  }

  if (method === 'post' && url.pathname === '/upload') {
    const currentUser = getCurrentUser(config, database)

    if (!requireAdmin(currentUser)) {
      return settleResponse(config, makeResponse(config, 401, { message: '仅管理员可上传图片' }))
    }

    const payload = parseData<{ filename: string; dataUrl: string }>(config)
    const uploadResponse: UploadResponse = {
      url: payload.dataUrl,
    }

    return settleResponse(config, makeResponse(config, 200, uploadResponse))
  }

  if (method === 'get' && url.pathname === '/users') {
    const currentUser = getCurrentUser(config, database)

    if (!requireAdmin(currentUser)) {
      return settleResponse(config, makeResponse(config, 403, { message: '仅管理员可查看用户列表' }))
    }

    const response: UsersResponse = {
      items: [...database.users]
        .filter((user) => user.role === 'viewer')
        .sort((a, b) => {
          if (a.status !== b.status) {
            return a.status === 'active' ? -1 : 1
          }

          return a.username.localeCompare(b.username)
        })
        .map((user) => makeManagedUser(user, database)),
    }

    return settleResponse(config, makeResponse(config, 200, response))
  }

  if (method === 'post' && url.pathname === '/users') {
    const currentUser = getCurrentUser(config, database)

    if (!requireAdmin(currentUser)) {
      return settleResponse(config, makeResponse(config, 403, { message: '仅管理员可新增普通用户' }))
    }

    const payload = parseData<CreateUserPayload>(config)
    const usernameMessage = validateUsername(payload.username, database)

    if (usernameMessage) {
      return settleResponse(config, makeResponse(config, 400, { message: usernameMessage }))
    }

    const passwordMessage = validatePassword(payload.password)

    if (passwordMessage) {
      return settleResponse(config, makeResponse(config, 400, { message: passwordMessage }))
    }

    const nameMessage = validateDisplayName(payload.name)

    if (nameMessage) {
      return settleResponse(config, makeResponse(config, 400, { message: nameMessage }))
    }

    const nextUser = {
      id: database.nextUserId,
      username: payload.username.trim(),
      password: payload.password.trim(),
      name: payload.name.trim(),
      role: 'viewer' as const,
      status: 'active' as const,
      bio: normalizeBio(payload.bio),
      avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(payload.name.trim())}`,
    }

    database.users.push(nextUser)
    database.nextUserId += 1
    saveDatabase(database)

    return settleResponse(config, makeResponse(config, 201, makeManagedUser(nextUser, database)))
  }

  const userMatch = url.pathname.match(/^\/users\/(\d+)$/)

  if (method === 'put' && userMatch) {
    const currentUser = getCurrentUser(config, database)

    if (!requireAdmin(currentUser)) {
      return settleResponse(config, makeResponse(config, 403, { message: '仅管理员可修改普通用户' }))
    }

    const userId = Number(userMatch[1])
    const targetUser = database.users.find((user) => user.id === userId && user.role === 'viewer')

    if (!targetUser) {
      return settleResponse(config, makeResponse(config, 404, { message: '普通用户不存在' }))
    }

    if (targetUser.status !== 'active') {
      return settleResponse(config, makeResponse(config, 400, { message: '已注销账号不能再修改用户名' }))
    }

    const payload = parseData<UpdateUserProfilePayload>(config)
    const validationMessage = validateUsername(payload.username, database, targetUser.id)

    if (validationMessage) {
      return settleResponse(config, makeResponse(config, 400, { message: validationMessage }))
    }

    targetUser.username = payload.username.trim()
    database.comments = database.comments.map((comment) =>
      comment.authorId === targetUser.id ? { ...comment, author: targetUser.name } : comment,
    )
    saveDatabase(database)

    return settleResponse(config, makeResponse(config, 200, makeManagedUser(targetUser, database)))
  }

  const userPasswordMatch = url.pathname.match(/^\/users\/(\d+)\/password$/)

  if (method === 'patch' && userPasswordMatch) {
    const currentUser = getCurrentUser(config, database)

    if (!requireAdmin(currentUser)) {
      return settleResponse(config, makeResponse(config, 403, { message: '仅管理员可修改普通用户密码' }))
    }

    const userId = Number(userPasswordMatch[1])
    const targetUser = database.users.find((user) => user.id === userId && user.role === 'viewer')

    if (!targetUser) {
      return settleResponse(config, makeResponse(config, 404, { message: '普通用户不存在' }))
    }

    if (targetUser.status !== 'active') {
      return settleResponse(config, makeResponse(config, 400, { message: '已注销账号不能再修改密码' }))
    }

    const payload = parseData<UpdateUserPasswordPayload>(config)
    const validationMessage = validatePassword(payload.password)

    if (validationMessage) {
      return settleResponse(config, makeResponse(config, 400, { message: validationMessage }))
    }

    targetUser.password = payload.password.trim()
    saveDatabase(database)

    return settleResponse(config, makeResponse(config, 200, makeManagedUser(targetUser, database)))
  }

  const userCancelMatch = url.pathname.match(/^\/users\/(\d+)\/cancel$/)

  if (method === 'patch' && userCancelMatch) {
    const currentUser = getCurrentUser(config, database)

    if (!requireAdmin(currentUser)) {
      return settleResponse(config, makeResponse(config, 403, { message: '仅管理员可注销普通用户' }))
    }

    const userId = Number(userCancelMatch[1])
    const targetUser = database.users.find((user) => user.id === userId && user.role === 'viewer')

    if (!targetUser) {
      return settleResponse(config, makeResponse(config, 404, { message: '普通用户不存在' }))
    }

    if (targetUser.status === 'cancelled') {
      return settleResponse(config, makeResponse(config, 400, { message: '该普通用户已经被注销' }))
    }

    targetUser.status = 'cancelled'
    saveDatabase(database)

    return settleResponse(config, makeResponse(config, 200, makeManagedUser(targetUser, database)))
  }

  return settleResponse(
    config,
    makeResponse(config, 404, { message: `未实现接口：${method.toUpperCase()} ${url.pathname}` }),
  )
}

function settleResponse<T>(config: InternalAxiosRequestConfig, response: AxiosResponse<T>) {
  const validateStatus = config.validateStatus ?? ((status: number) => status >= 200 && status < 300)

  if (validateStatus(response.status)) {
    return Promise.resolve(response)
  }

  const data = response.data as { message?: string } | undefined
  const code = response.status >= 500 ? AxiosErrorCtor.ERR_BAD_RESPONSE : AxiosErrorCtor.ERR_BAD_REQUEST

  return Promise.reject(
    new AxiosErrorCtor(
      data?.message ?? `Request failed with status code ${response.status}`,
      code,
      config,
      null,
      response,
    ) as AxiosError<T>,
  )
}
