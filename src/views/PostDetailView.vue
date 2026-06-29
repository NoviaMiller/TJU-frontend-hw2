<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { marked } from 'marked'

import { getComments, getPost } from '@/api/services'
import CommentPanel from '@/components/CommentPanel.vue'
import EmptyState from '@/components/EmptyState.vue'
import { formatDate, formatViews } from '@/lib/format'
import type { Comment, Post } from '@/types'

const route = useRoute()
const loading = ref(false)
const commentsLoading = ref(false)
const errorMessage = ref('')
const post = ref<Post | null>(null)
const comments = ref<Comment[]>([])

const renderedContent = computed(() => {
  if (!post.value) {
    return ''
  }

  if (post.value.format === 'markdown') {
    return marked.parse(post.value.content)
  }

  return post.value.content
})

async function loadPost() {
  const id = Number(route.params.id)

  if (!id) {
    errorMessage.value = '文章编号无效'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    post.value = await getPost(id)
    await loadComments()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '文章加载失败'
  } finally {
    loading.value = false
  }
}

async function loadComments() {
  if (!post.value) {
    return
  }

  commentsLoading.value = true

  try {
    const response = await getComments(post.value.id)
    comments.value = response.items
  } finally {
    commentsLoading.value = false
  }
}

watch(
  () => route.params.id,
  () => {
    void loadPost()
  },
)

onMounted(() => {
  void loadPost()
})
</script>

<template>
  <main class="page-shell">
    <section class="container detail-shell">
      <RouterLink class="text-link" :to="{ name: 'home' }">返回文章列表</RouterLink>

      <div v-if="loading" class="empty-state">
        <strong>文章加载中</strong>
        <p>正在展开正文与评论内容。</p>
      </div>

      <EmptyState
        v-else-if="errorMessage"
        title="文章打开失败"
        :description="errorMessage"
      />

      <template v-else-if="post">
        <article class="detail-card">
          <img class="detail-card__cover" :src="post.coverImage" :alt="post.title" />

          <div class="detail-card__header">
            <div class="detail-card__meta">
              <span class="pill pill--accent" v-if="post.pinned">置顶文章</span>
              <span class="pill">{{ post.category }}</span>
              <span>{{ formatDate(post.updatedAt) }}</span>
              <span>{{ formatViews(post.views) }} 阅读</span>
            </div>

            <h1>{{ post.title }}</h1>
            <p>{{ post.summary }}</p>

            <div class="tag-list">
              <span v-for="tag in post.tags" :key="tag" class="pill pill--soft"># {{ tag }}</span>
            </div>
          </div>

          <div class="prose" v-html="renderedContent" />
        </article>

        <CommentPanel
          :post-id="post.id"
          :comments="comments"
          :loading="commentsLoading"
          @submitted="loadComments"
        />
      </template>
    </section>
  </main>
</template>
