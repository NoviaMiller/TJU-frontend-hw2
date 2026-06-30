<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { getPosts } from '@/api/services'
import EmptyState from '@/components/EmptyState.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import PostCard from '@/components/PostCard.vue'
import type { Post } from '@/types'

const PAGE_ROWS = 3
const POSTS_PER_ROW = 3

type PageGroup = {
  pinned: Post[]
  regular: Post[]
}

const loading = ref(false)
const errorMessage = ref('')
const posts = ref<Post[]>([])
const categories = ref<string[]>([])

const filters = reactive({
  q: '',
  category: '全部',
  page: 1,
  pageSize: PAGE_ROWS,
})

const pagination = reactive({
  page: 1,
  pageSize: PAGE_ROWS,
  total: 0,
  totalPages: 1,
})

const pageGroups = computed<PageGroup[]>(() => {
  const pinnedQueue = posts.value.filter((post) => post.pinned)
  const regularQueue = posts.value.filter((post) => !post.pinned)
  const groups: PageGroup[] = []
  let pinnedIndex = 0
  let regularIndex = 0

  while (pinnedIndex < pinnedQueue.length || regularIndex < regularQueue.length) {
    const group: PageGroup = {
      pinned: [],
      regular: [],
    }
    let remainingRows = PAGE_ROWS

    while (remainingRows > 0 && pinnedIndex < pinnedQueue.length) {
      const pinnedPost = pinnedQueue[pinnedIndex]

      if (!pinnedPost) {
        break
      }

      group.pinned.push(pinnedPost)
      pinnedIndex += 1
      remainingRows -= 1
    }

    if (remainingRows > 0 && regularIndex < regularQueue.length) {
      const takeCount = Math.min(remainingRows * POSTS_PER_ROW, regularQueue.length - regularIndex)
      group.regular = regularQueue.slice(regularIndex, regularIndex + takeCount)
      regularIndex += takeCount
    }

    groups.push(group)
  }

  return groups
})

const currentPageGroup = computed<PageGroup>(() => {
  return pageGroups.value[filters.page - 1] ?? {
    pinned: [],
    regular: [],
  }
})

const pinnedPosts = computed(() => currentPageGroup.value.pinned)
const restPosts = computed(() => currentPageGroup.value.regular)

async function loadPosts() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getPosts({
      page: 1,
      pageSize: 999,
      q: filters.q,
      category: filters.category === '全部' ? '' : filters.category,
    })

    posts.value = response.items
    categories.value = ['全部', ...response.categories]
    const totalPages = Math.max(pageGroups.value.length, 1)

    if (filters.page > totalPages) {
      filters.page = totalPages
    }

    Object.assign(pagination, {
      page: filters.page,
      pageSize: PAGE_ROWS,
      total: response.pagination.total,
      totalPages,
    })
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
    void loadPosts()
  },
)

watch(
  () => filters.page,
  (page) => {
    pagination.page = page
  },
)

onMounted(() => {
  void loadPosts()
})
</script>

<template>
  <main class="page-shell page-shell--luxe">
    <section class="container library-shell library-shell--luxe">
      <div class="section-heading section-heading--stack section-heading--feature">
        <div>
          <span class="section-kicker">内容目录</span>
          <h2>按门类、关键词和阅读动线浏览文章</h2>
        </div>
      </div>

      <div class="filters-bar filters-bar--floating">
        <div class="filters-bar__main">
          <label class="search-box search-box--hero">
            <span>搜索文章</span>
            <input v-model="filters.q" type="search" placeholder="搜索标题、正文或标签关键词" />
          </label>

          <div class="category-strip category-strip--floating" role="tablist" aria-label="文章分类">
            <button v-for="category in categories" :key="category" type="button" class="chip-button"
              :class="{ 'chip-button--active': category === filters.category }" @click="filters.category = category">
              {{ category }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="feature-card feature-card--skeleton" aria-hidden="true">
        <div class="feature-card__image feature-card__image--skeleton" />
        <div class="feature-card__body">
          <span class="skeleton-line skeleton-line--short" />
          <span class="skeleton-line skeleton-line--title" />
          <span class="skeleton-line" />
          <span class="skeleton-line skeleton-line--wide" />
        </div>
      </div>

      <EmptyState v-else-if="errorMessage" title="加载失败" :description="errorMessage" />

      <template v-else-if="posts.length">
        <article v-for="heroPost in pinnedPosts" :key="heroPost.id" class="feature-card feature-card--luxe">
          <div class="feature-card__frame">
            <img class="feature-card__image" :src="heroPost.coverImage" :alt="heroPost.title" />
          </div>

          <div class="feature-card__panel">
            <div class="feature-card__body feature-card__body--feature feature-card__body--luxe">
              <div class="feature-card__meta">
                <span v-if="heroPost.pinned" class="pill pill--accent">首页推荐</span>
                <span class="pill">{{ heroPost.category }}</span>
                <span>{{ heroPost.views }} 阅读</span>
              </div>

              <div class="feature-card__copy">
                <h2>{{ heroPost.title }}</h2>
                <p>{{ heroPost.summary }}</p>
              </div>

              <RouterLink class="primary-button primary-button--with-orb"
                :to="{ name: 'post-detail', params: { id: heroPost.id } }">
                <span>查看详情</span>
                <span class="button-orb" aria-hidden="true">→</span>
              </RouterLink>
            </div>
          </div>
        </article>

        <div class="post-grid post-grid--magazine post-grid--luxe">
          <PostCard v-for="post in restPosts" :key="post.id" :post="post" />
        </div>

        <PaginationBar :page="pagination.page" :total-pages="pagination.totalPages" @change="filters.page = $event" />
      </template>

      <EmptyState v-else title="没有找到相关内容" description="试试切换门类、减少关键词，或者从首页推荐开始阅读。" />
    </section>
  </main>
</template>
