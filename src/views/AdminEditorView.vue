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
          <p>富文本和 Markdown 都可用，封面上传会先走模拟接口。</p>
        </div>
      </div>

      <div v-if="loading" class="empty-state">
        <strong>正在加载文章</strong>
        <p>马上就好，编辑器正在准备内容。</p>
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
