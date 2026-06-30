<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { getPost } from '@/api/services'
import AdminPostForm from '@/components/AdminPostForm.vue'
import EmptyState from '@/components/EmptyState.vue'
import type { Post } from '@/types'

const route = useRoute()
const loading = ref(false)
const errorMessage = ref('')
const post = ref<Post | null>(null)

const mode = computed(() => (route.name === 'admin-edit' ? 'edit' : 'create'))

async function loadPost() {
  if (mode.value !== 'edit') {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    post.value = await getPost(Number(route.params.id))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '文章加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadPost()
})
</script>

<template>
  <main class="page-shell">
    <section class="container editor-shell">
      <div class="admin-toolbar">
        <div>
          <span class="eyebrow">后台编辑</span>
          <h1>{{ mode === 'create' ? '发布新文章' : '编辑现有文章' }}</h1>
          <p>支持 Markdown 和富文本，适合发布经典导读、摘录评注与专题文章。</p>
        </div>
      </div>

      <div v-if="loading" class="empty-state">
        <strong>正在加载文章</strong>
        <p>编辑器正在准备稿件内容。</p>
      </div>

      <EmptyState
        v-else-if="errorMessage"
        title="无法打开编辑器"
        :description="errorMessage"
      />

      <AdminPostForm v-else :mode="mode" :post="post" />
    </section>
  </main>
</template>
