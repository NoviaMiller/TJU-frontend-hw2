<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { getPosts } from '@/api/services'
import EmptyState from '@/components/EmptyState.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import PostCard from '@/components/PostCard.vue'
import type { Post } from '@/types'

const loading = ref(false)
const errorMessage = ref('')
const posts = ref<Post[]>([])
const categories = ref<string[]>([])

const filters = reactive({
  q: '',
  category: '全部',
  page: 1,
  pageSize: 6,
})

const pagination = reactive({
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 1,
})

const heroPost = computed(() => posts.value[0] ?? null)
const restPosts = computed(() => posts.value.slice(1))

async function loadPosts() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getPosts({
      page: filters.page,
      pageSize: filters.pageSize,
      q: filters.q,
      category: filters.category === '全部' ? '' : filters.category,
    })

    posts.value = response.items
    categories.value = ['全部', ...response.categories]
    Object.assign(pagination, response.pagination)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '文章加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => [filters.category, filters.q],
  () => {
    filters.page = 1
  },
)

watch(
  () => [filters.page, filters.category, filters.q],
  () => {
    void loadPosts()
  },
)

onMounted(() => {
  void loadPosts()
})
</script>

<template>
  <main class="page-shell">
    <section class="hero-section container">
      <div class="hero-copy">
        <span class="eyebrow">课程 Wiki 前台展示</span>
        <h1>把课程资料做成真正可搜索、可阅读、可维护的知识站点</h1>
        <p>
          这个前端作业实现了文章分页、详情渲染、分类标签、游客评论，以及带权限控制的后台管理流。
          目前接口走 mock 数据，后续可以平滑切到 Express + MySQL。
        </p>
      </div>

      <div class="hero-panel">
        <div class="hero-panel__metric">
          <strong>{{ pagination.total }}</strong>
          <span>公开文章</span>
        </div>
        <div class="hero-panel__metric">
          <strong>{{ categories.length - 1 }}</strong>
          <span>内容分类</span>
        </div>
        <div class="hero-panel__metric">
          <strong>JWT</strong>
          <span>模拟鉴权</span>
        </div>
      </div>
    </section>

    <section class="container filters-bar">
      <div class="filters-bar__main">
        <label class="search-box">
          <span>搜索</span>
          <input
            v-model="filters.q"
            type="search"
            placeholder="搜索标题、正文或标签关键词"
          />
        </label>

        <div class="category-strip">
          <button
            v-for="category in categories"
            :key="category"
            type="button"
            class="chip-button"
            :class="{ 'chip-button--active': category === filters.category }"
            @click="filters.category = category"
          >
            {{ category }}
          </button>
        </div>
      </div>
    </section>

    <section class="container">
      <div v-if="loading" class="empty-state">
        <strong>文章加载中</strong>
        <p>正在整理课程内容，请稍候。</p>
      </div>

      <EmptyState
        v-else-if="errorMessage"
        title="加载失败"
        :description="errorMessage"
      />

      <template v-else-if="posts.length">
        <article v-if="heroPost" class="feature-card">
          <img class="feature-card__image" :src="heroPost.coverImage" :alt="heroPost.title" />

          <div class="feature-card__body">
            <div class="feature-card__meta">
              <span class="pill pill--accent" v-if="heroPost.pinned">首页置顶</span>
              <span class="pill">{{ heroPost.category }}</span>
              <span>{{ heroPost.views }} 阅读</span>
            </div>

            <h2>{{ heroPost.title }}</h2>
            <p>{{ heroPost.summary }}</p>

            <RouterLink class="primary-button" :to="{ name: 'post-detail', params: { id: heroPost.id } }">
              查看详情
            </RouterLink>
          </div>
        </article>

        <div class="post-grid">
          <PostCard v-for="post in restPosts" :key="post.id" :post="post" />
        </div>

        <PaginationBar
          :page="pagination.page"
          :total-pages="pagination.totalPages"
          @change="filters.page = $event"
        />
      </template>

      <EmptyState
        v-else
        title="没有找到相关文章"
        description="试试更换分类或减少搜索关键词。"
      />
    </section>
  </main>
</template>
