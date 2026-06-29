<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { deletePost, getPosts } from '@/api/services'
import EmptyState from '@/components/EmptyState.vue'
import { formatDate, formatViews } from '@/lib/format'
import type { Post } from '@/types'

const loading = ref(false)
const errorMessage = ref('')
const deletingId = ref<number | null>(null)
const posts = ref<Post[]>([])

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

onMounted(() => {
  void loadPosts()
})
</script>

<template>
  <main class="page-shell">
    <section class="container admin-shell">
      <div class="admin-toolbar">
        <div>
          <span class="eyebrow">后台管理</span>
          <h1>文章工作台</h1>
          <p>这里支持发布、编辑、删除、置顶和查看草稿状态。</p>
        </div>

        <RouterLink class="primary-button" :to="{ name: 'admin-create' }">发布新文章</RouterLink>
      </div>

      <section class="card-section">
        <div class="dashboard-filters">
          <label class="search-box">
            <span>搜索</span>
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

        <div v-if="loading" class="empty-state">
          <strong>后台数据加载中</strong>
          <p>正在同步文章列表。</p>
        </div>

        <EmptyState
          v-else-if="errorMessage"
          title="加载失败"
          :description="errorMessage"
        />

        <div v-else-if="filteredPosts.length" class="table-shell">
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
                <td>
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
                <td>{{ post.category }}</td>
                <td>{{ post.status === 'published' ? '已发布' : '草稿' }}</td>
                <td>{{ formatViews(post.views) }}</td>
                <td>{{ formatDate(post.updatedAt) }}</td>
                <td>
                  <div class="table-actions">
                    <RouterLink class="text-link" :to="{ name: 'post-detail', params: { id: post.id } }">
                      预览
                    </RouterLink>
                    <RouterLink class="text-link" :to="{ name: 'admin-edit', params: { id: post.id } }">
                      编辑
                    </RouterLink>
                    <button
                      type="button"
                      class="text-link text-link--danger"
                      :disabled="deletingId === post.id"
                      @click="removePost(post.id)"
                    >
                      {{ deletingId === post.id ? '删除中...' : '删除' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <EmptyState
          v-else
          title="当前没有匹配文章"
          description="试试切换分类，或者清空搜索条件。"
        />
      </section>
    </section>
  </main>
</template>
