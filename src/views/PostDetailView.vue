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
    <section class="container detail-shell detail-shell--reading">
      <RouterLink class="back-link" :to="{ name: 'home' }">← 返回文章列表</RouterLink>

      <div v-if="loading" class="detail-loading">
        <div class="detail-loading__cover" />
        <div class="detail-loading__body">
          <span class="skeleton-line skeleton-line--short" />
          <span class="skeleton-line skeleton-line--title" />
          <span class="skeleton-line" />
          <span class="skeleton-line skeleton-line--wide" />
        </div>
      </div>

      <EmptyState
        v-else-if="errorMessage"
        title="文章打开失败"
        :description="errorMessage"
      />

      <template v-else-if="post">
        <article class="detail-card detail-card--reading">
          <div class="detail-card__masthead">
            <div class="detail-card__header detail-card__header--reading">
              <div class="detail-card__meta">
                <span v-if="post.pinned" class="pill pill--accent">重点文章</span>
                <span class="pill">{{ post.category }}</span>
                <span>{{ formatDate(post.updatedAt) }}</span>
                <span>{{ formatViews(post.views) }} 阅读</span>
              </div>

              <div class="detail-card__title-group">
                <h1>{{ post.title }}</h1>
                <p>{{ post.summary }}</p>
              </div>

              <div class="detail-card__footnotes">
                <span>作者 {{ post.authorName }}</span>
                <div class="tag-list">
                  <span v-for="tag in post.tags" :key="tag" class="pill pill--tag"># {{ tag }}</span>
                </div>
              </div>
            </div>

            <img class="detail-card__cover" :src="post.coverImage" :alt="post.title" />
          </div>

          <div class="detail-article-layout">
            <aside class="detail-note">
              <span class="section-kicker">阅读提示</span>
              <p>这篇文章支持长期维护与分类归档，适合作为专题导读、经典摘读与持续整理的内容节点。</p>
            </aside>

            <div class="prose prose--reading" v-html="renderedContent" />
          </div>
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
