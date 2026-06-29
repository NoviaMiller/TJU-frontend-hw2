<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { createExcerpt, formatDate, formatViews } from '@/lib/format'
import type { Post } from '@/types'

const props = defineProps<{
  post: Post
}>()

const excerpt = computed(() =>
  props.post.summary || createExcerpt(props.post.content, 120),
)
</script>

<template>
  <article class="post-card">
    <div class="post-card__media">
      <img :src="post.coverImage" :alt="post.title" />
      <div class="post-card__overlay">
        <span v-if="post.pinned" class="pill pill--accent">置顶</span>
        <span class="pill">{{ post.category }}</span>
      </div>
    </div>

    <div class="post-card__body">
      <div class="post-card__meta">
        <span>{{ post.authorName }}</span>
        <span>{{ formatDate(post.updatedAt) }}</span>
        <span>{{ formatViews(post.views) }} 阅读</span>
      </div>

      <RouterLink class="post-card__title" :to="{ name: 'post-detail', params: { id: post.id } }">
        {{ post.title }}
      </RouterLink>

      <p class="post-card__summary">{{ excerpt }}</p>

      <div class="post-card__footer">
        <div class="tag-list">
          <span v-for="tag in post.tags" :key="tag" class="pill pill--soft"># {{ tag }}</span>
        </div>

        <RouterLink class="text-link" :to="{ name: 'post-detail', params: { id: post.id } }">
          阅读全文
        </RouterLink>
      </div>
    </div>
  </article>
</template>
