<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { createComment } from '@/api/services'
import { formatDate } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import type { Comment } from '@/types'

const props = defineProps<{
  postId: number
  comments: Comment[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (event: 'submitted'): void
}>()

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({
  content: '',
})

const submitting = ref(false)
const errorMessage = ref('')

const commentHint = computed(() => {
  if (!authStore.isAuthenticated) {
    return '登录后即可参与讨论，系统会自动返回当前文章。'
  }

  return `当前将以 ${authStore.user?.name ?? authStore.user?.username ?? '当前用户'} 的身份发表评论。`
})

async function submitComment() {
  errorMessage.value = ''

  if (!authStore.isAuthenticated) {
    await router.push({
      name: 'login',
      query: {
        redirect: `/posts/${props.postId}`,
      },
    })
    return
  }

  if (!form.content.trim()) {
    errorMessage.value = '请先填写评论内容。'
    return
  }

  submitting.value = true

  try {
    await createComment({
      postId: props.postId,
      content: form.content,
    })

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
    <div class="section-heading section-heading--stack">
      <div>
        <span class="section-kicker">读者讨论</span>
        <h2>评论区</h2>
        <p>{{ comments.length }} 条留言。{{ commentHint }}</p>
      </div>
    </div>

    <form class="comment-form" @submit.prevent="submitComment">
      <label class="field field--full">
        <span>评论内容</span>
        <textarea
          v-model="form.content"
          rows="4"
          maxlength="280"
          :placeholder="
            authStore.isAuthenticated
              ? '写下你的读后感、补充出处或不同理解……'
              : '登录后可以在这里写下你的读后感、补充出处或不同理解……'
          "
        />
      </label>

      <div class="form-actions form-actions--comment">
        <span v-if="errorMessage" class="form-error">{{ errorMessage }}</span>
        <span v-else class="form-hint">建议 1 到 3 句话，方便其他读者快速阅读。</span>

        <button class="primary-button" type="submit" :disabled="submitting">
          {{ submitting ? '提交中...' : authStore.isAuthenticated ? '发表评论' : '登录后评论' }}
        </button>
      </div>
    </form>

    <div v-if="loading" class="comment-skeleton-list" aria-hidden="true">
      <div v-for="index in 3" :key="index" class="comment-skeleton">
        <span class="comment-skeleton__line comment-skeleton__line--short" />
        <span class="comment-skeleton__line" />
        <span class="comment-skeleton__line comment-skeleton__line--wide" />
      </div>
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

    <div v-else class="empty-state empty-state--subtle">
      <span class="empty-state__eyebrow">讨论尚未开始</span>
      <strong>还没有评论</strong>
      <p>你可以成为第一位分享读后感、补充出处或提出问题的人。</p>
    </div>
  </section>
</template>
