<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'

import {
  cancelUser,
  deletePost,
  getPosts,
  getUsers,
  updateUserPassword,
  updateUserProfile,
} from '@/api/services'
import EmptyState from '@/components/EmptyState.vue'
import { formatDate, formatViews } from '@/lib/format'
import type { ManagedUser, Post } from '@/types'

const loading = ref(false)
const userLoading = ref(false)
const errorMessage = ref('')
const userErrorMessage = ref('')
const deletingId = ref<number | null>(null)
const updatingUserId = ref<number | null>(null)
const posts = ref<Post[]>([])
const users = ref<ManagedUser[]>([])

const filters = reactive({
  q: '',
  category: '全部',
})

const categories = computed(() => [
  '全部',
  ...Array.from(new Set(posts.value.map((post) => post.category))),
])

const filteredPosts = computed(() => {
  const keyword = filters.q.trim().toLowerCase()

  return posts.value.filter((post) => {
    const matchedCategory = filters.category === '全部' || filters.category === post.category
    const matchedKeyword =
      !keyword ||
      [post.title, post.summary, post.content, post.tags.join(' '), post.category]
        .join(' ')
        .toLowerCase()
        .includes(keyword)

    return matchedCategory && matchedKeyword
  })
})

const activeUsers = computed(() => users.value.filter((user) => user.status === 'active'))
const cancelledUsers = computed(() => users.value.filter((user) => user.status === 'cancelled'))
const publishedPosts = computed(() => posts.value.filter((post) => post.status === 'published'))
const draftPosts = computed(() => posts.value.filter((post) => post.status === 'draft'))

async function loadPosts() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getPosts({
      page: 1,
      pageSize: 100,
      includeDrafts: true,
    })

    posts.value = response.items
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '文章加载失败'
  } finally {
    loading.value = false
  }
}

async function loadUsers() {
  userLoading.value = true
  userErrorMessage.value = ''

  try {
    const response = await getUsers()
    users.value = response.items
  } catch (error) {
    userErrorMessage.value = error instanceof Error ? error.message : '用户列表加载失败'
  } finally {
    userLoading.value = false
  }
}

async function removePost(id: number) {
  const shouldDelete = window.confirm('确认删除这篇文章吗？此操作会一并移除相关评论。')

  if (!shouldDelete) {
    return
  }

  deletingId.value = id

  try {
    await deletePost(id)
    await loadPosts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '删除失败'
  } finally {
    deletingId.value = null
  }
}

async function editUsername(user: ManagedUser) {
  const nextUsername = window.prompt(`请输入 ${user.username} 的新用户名`, user.username)

  if (nextUsername === null || nextUsername.trim() === user.username) {
    return
  }

  updatingUserId.value = user.id
  userErrorMessage.value = ''

  try {
    await updateUserProfile(user.id, {
      username: nextUsername,
    })
    await loadUsers()
  } catch (error) {
    userErrorMessage.value = error instanceof Error ? error.message : '用户名修改失败'
  } finally {
    updatingUserId.value = null
  }
}

async function editPassword(user: ManagedUser) {
  const nextPassword = window.prompt(`请输入 ${user.username} 的新密码`, '')

  if (nextPassword === null || !nextPassword.trim()) {
    return
  }

  updatingUserId.value = user.id
  userErrorMessage.value = ''

  try {
    await updateUserPassword(user.id, {
      password: nextPassword,
    })
    await loadUsers()
  } catch (error) {
    userErrorMessage.value = error instanceof Error ? error.message : '密码修改失败'
  } finally {
    updatingUserId.value = null
  }
}

async function disableUser(user: ManagedUser) {
  const shouldCancel = window.confirm(
    `确认注销普通用户 ${user.username} 吗？注销后该账号将无法再次登录。`,
  )

  if (!shouldCancel) {
    return
  }

  updatingUserId.value = user.id
  userErrorMessage.value = ''

  try {
    await cancelUser(user.id)
    await loadUsers()
  } catch (error) {
    userErrorMessage.value = error instanceof Error ? error.message : '用户注销失败'
  } finally {
    updatingUserId.value = null
  }
}

onMounted(() => {
  void loadPosts()
  void loadUsers()
})
</script>

<template>
  <main class="page-shell">
    <section class="container admin-shell admin-shell--dashboard">
      <div class="admin-hero">
        <div class="admin-toolbar admin-toolbar--hero">
          <div>
            <span class="eyebrow">后台管理</span>
            <h1>内容与账户总览</h1>
          </div>

          <RouterLink class="primary-button" :to="{ name: 'admin-create' }">发布新文章</RouterLink>
        </div>

        <div class="admin-overview-grid">
          <article class="admin-overview-card">
            <span class="section-kicker">文章状态</span>
            <strong>{{ publishedPosts.length }}</strong>
            <p>已发布文章</p>
          </article>
          <article class="admin-overview-card">
            <span class="section-kicker">待完善内容</span>
            <strong>{{ draftPosts.length }}</strong>
            <p>草稿文章</p>
          </article>
          <article class="admin-overview-card">
            <span class="section-kicker">当前用户</span>
            <strong>{{ activeUsers.length }}</strong>
            <p>活跃普通用户</p>
          </article>
          <article class="admin-overview-card">
            <span class="section-kicker">历史记录</span>
            <strong>{{ cancelledUsers.length }}</strong>
            <p>已注销账号</p>
          </article>
        </div>
      </div>

      <section class="card-section card-section--dense">
        <div class="section-heading">
          <div>
            <span class="section-kicker">内容维护</span>
            <h2>文章管理</h2>
          </div>
        </div>

        <div class="dashboard-filters dashboard-filters--admin">
          <label class="search-box search-box--hero">
            <span>搜索文章</span>
            <input v-model="filters.q" type="search" placeholder="按标题、标签或内容关键词搜索" />
          </label>

          <label class="field field--compact">
            <span>分类筛选</span>
            <select v-model="filters.category">
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </label>
        </div>

        <div v-if="loading" class="table-skeleton" aria-hidden="true">
          <div v-for="index in 4" :key="index" class="table-skeleton__row" />
        </div>

        <EmptyState v-else-if="errorMessage" title="加载失败" :description="errorMessage" />

        <div v-else-if="filteredPosts.length" class="table-shell table-shell--cards">
          <table class="post-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>分类</th>
                <th>状态</th>
                <th>阅读量</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="post in filteredPosts" :key="post.id">
                <td data-label="标题">
                  <div class="table-title">
                    <strong>{{ post.title }}</strong>
                    <div class="tag-list">
                      <span v-if="post.pinned" class="pill pill--accent">置顶</span>
                      <span v-for="tag in post.tags.slice(0, 2)" :key="tag" class="pill pill--soft">
                        # {{ tag }}
                      </span>
                    </div>
                  </div>
                </td>
                <td data-label="分类">{{ post.category }}</td>
                <td data-label="状态">
                  <span class="status-dot"
                    :class="post.status === 'published' ? 'status-dot--ok' : 'status-dot--muted'">
                    {{ post.status === 'published' ? '已发布' : '草稿' }}
                  </span>
                </td>
                <td data-label="阅读量">{{ formatViews(post.views) }}</td>
                <td data-label="更新时间">{{ formatDate(post.updatedAt) }}</td>
                <td data-label="操作">
                  <div class="table-actions">
                    <RouterLink class="text-link" :to="{ name: 'post-detail', params: { id: post.id } }">
                      预览
                    </RouterLink>
                    <RouterLink class="text-link" :to="{ name: 'admin-edit', params: { id: post.id } }">
                      编辑
                    </RouterLink>
                    <button type="button" class="text-link text-link--danger" :disabled="deletingId === post.id"
                      @click="removePost(post.id)">
                      {{ deletingId === post.id ? '删除中...' : '删除' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <EmptyState v-else title="当前没有匹配文章" description="试试切换分类、清空搜索词，或者直接新增一篇导读文章。" />
      </section>

      <section class="card-section card-section--dense">
        <div class="section-heading">
          <div>
            <span class="section-kicker">用户维护</span>
            <h2>普通用户管理</h2>
          </div>
        </div>

        <div class="dashboard-filters">
          <div class="hero-panel__metric admin-stat">
            <strong>{{ activeUsers.length }}</strong>
            <span>活跃普通用户</span>
          </div>
          <div class="hero-panel__metric admin-stat">
            <strong>{{ cancelledUsers.length }}</strong>
            <span>已注销账号</span>
          </div>
        </div>

        <div v-if="userLoading" class="table-skeleton" aria-hidden="true">
          <div v-for="index in 3" :key="index" class="table-skeleton__row" />
        </div>

        <EmptyState v-else-if="userErrorMessage" title="用户列表加载失败" :description="userErrorMessage" />

        <div v-else-if="users.length" class="table-shell table-shell--cards">
          <table class="post-table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>显示名</th>
                <th>状态</th>
                <th>评论数</th>
                <th>简介</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td data-label="用户名">
                  <div class="table-title">
                    <strong>{{ user.username }}</strong>
                    <div class="tag-list">
                      <span class="pill" :class="user.status === 'active' ? 'pill--soft' : ''">
                        {{ user.status === 'active' ? '可登录' : '已注销' }}
                      </span>
                    </div>
                  </div>
                </td>
                <td data-label="显示名">{{ user.name }}</td>
                <td data-label="状态">
                  <span class="status-dot" :class="user.status === 'active' ? 'status-dot--ok' : 'status-dot--muted'">
                    {{ user.status === 'active' ? '活跃' : '已注销' }}
                  </span>
                </td>
                <td data-label="评论数">{{ user.commentCount }}</td>
                <td data-label="简介">{{ user.bio }}</td>
                <td data-label="操作">
                  <div class="table-actions">
                    <button type="button" class="text-link"
                      :disabled="updatingUserId === user.id || user.status !== 'active'" @click="editUsername(user)">
                      改用户名
                    </button>
                    <button type="button" class="text-link"
                      :disabled="updatingUserId === user.id || user.status !== 'active'" @click="editPassword(user)">
                      改密码
                    </button>
                    <button type="button" class="text-link text-link--danger"
                      :disabled="updatingUserId === user.id || user.status !== 'active'" @click="disableUser(user)">
                      {{ updatingUserId === user.id ? '处理中...' : '注销' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <EmptyState v-else title="当前没有普通用户" description="可以先用登录页中的普通用户账号进入前台发表评论，再回到这里查看管理状态。" />
      </section>
    </section>
  </main>
</template>
