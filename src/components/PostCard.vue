<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { createExcerpt, formatDate, formatViews } from '@/lib/format'
import type { Post } from '@/types'

const props = defineProps<{
  post: Post
}>()

const excerpt = computed(() => props.post.summary || createExcerpt(props.post.content, 132))

const detailRoute = computed(() => ({
  name: 'post-detail' as const,
  params: { id: props.post.id },
}))

const visibleTags = computed(() => props.post.tags.slice(0, 3))
</script>

<template>
  <article class="post-card post-card--luxe">
    <div class="post-card__shell">
      <RouterLink class="post-card__media" :to="detailRoute" :aria-label="`查看文章：${post.title}`">
        <img :src="post.coverImage" :alt="post.title" />
        <div class="post-card__overlay">
          <span v-if="post.pinned" class="pill pill--accent">置顶文章</span>
          <span class="pill">{{ post.category }}</span>
        </div>
      </RouterLink>

      <div class="post-card__body">
        <div class="post-card__meta">
          <span>{{ post.authorName }}</span>
          <span>{{ formatDate(post.updatedAt) }}</span>
          <span>{{ formatViews(post.views) }} 阅读</span>
        </div>

        <div class="post-card__content">
          <RouterLink class="post-card__title" :to="detailRoute">
            {{ post.title }}
          </RouterLink>

          <p class="post-card__summary">{{ excerpt }}</p>
        </div>

        <div class="post-card__footer">
          <div class="tag-list">
            <span v-for="tag in visibleTags" :key="tag" class="pill pill--tag"># {{ tag }}</span>
          </div>

          <RouterLink class="post-card__cta post-card__cta--island" :to="detailRoute">
            <span>阅读全文</span>
            <span class="button-orb button-orb--dark" aria-hidden="true">→</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </article>
</template>
