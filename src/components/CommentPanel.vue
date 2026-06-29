<script setup lang="ts">
import { reactive, ref } from 'vue'

import { createComment } from '@/api/services'
import { formatDate } from '@/lib/format'
import type { Comment } from '@/types'

const props = defineProps<{
  postId: number
  comments: Comment[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (event: 'submitted'): void
}>()

const form = reactive({
  author: '',
  content: '',
})

const submitting = ref(false)
const errorMessage = ref('')

async function submitComment() {
  errorMessage.value = ''

  if (!form.author.trim() || !form.content.trim()) {
    errorMessage.value = '请先填写昵称和评论内容。'
    return
  }

  submitting.value = true

  try {
    await createComment({
      postId: props.postId,
      author: form.author,
      content: form.content,
    })

    form.author = ''
    form.content = ''
    emit('submitted')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '评论提交失败'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="comment-panel card-section">
    <div class="section-heading">
      <div>
        <h2>评论区</h2>
        <p>{{ comments.length }} 条留言，游客也可以直接参与。</p>
      </div>
    </div>

    <form class="comment-form" @submit.prevent="submitComment">
      <div class="form-grid form-grid--comment">
        <label class="field">
          <span>昵称</span>
          <input v-model="form.author" type="text" maxlength="24" placeholder="例如：匿名同学" />
        </label>

        <label class="field field--full">
          <span>评论内容</span>
          <textarea
            v-model="form.content"
            rows="4"
            maxlength="280"
            placeholder="写下你的想法、建议或补充资料..."
          />
        </label>
      </div>

      <div class="form-actions">
        <span v-if="errorMessage" class="form-error">{{ errorMessage }}</span>
        <button class="primary-button" type="submit" :disabled="submitting">
          {{ submitting ? '提交中...' : '发表评论' }}
        </button>
      </div>
    </form>

    <div v-if="loading" class="empty-state">
      <strong>评论加载中</strong>
      <p>正在同步最新留言。</p>
    </div>

    <div v-else-if="comments.length" class="comment-list">
      <article v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-item__meta">
          <strong>{{ comment.author }}</strong>
          <span>{{ formatDate(comment.createdAt) }}</span>
        </div>
        <p>{{ comment.content }}</p>
      </article>
    </div>

    <div v-else class="empty-state">
      <strong>还没有评论</strong>
      <p>你可以成为第一个留言的人。</p>
    </div>
  </section>
</template>
