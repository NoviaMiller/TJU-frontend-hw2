<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({
  username: 'admin',
  password: 'admin123',
})

const loading = ref(false)
const errorMessage = ref('')

async function submitLogin() {
  loading.value = true
  errorMessage.value = ''

  try {
    await authStore.signIn({
      username: form.username,
      password: form.password,
    })

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin/posts'
    await router.push(redirect)
  } catch {
    errorMessage.value = '登录失败，请确认账号密码。可用账号：admin / admin123'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="page-shell">
    <section class="container auth-shell">
      <div class="auth-card">
        <span class="eyebrow">后台登录</span>
        <h1>进入文章管理台</h1>
        <p>演示账号已预置，管理员可发布、编辑、删除和置顶文章。</p>

        <form class="auth-form" @submit.prevent="submitLogin">
          <label class="field">
            <span>用户名</span>
            <input v-model="form.username" type="text" placeholder="admin" />
          </label>

          <label class="field">
            <span>密码</span>
            <input v-model="form.password" type="password" placeholder="admin123" />
          </label>

          <span v-if="errorMessage" class="form-error">{{ errorMessage }}</span>

          <button class="primary-button" type="submit" :disabled="loading">
            {{ loading ? '登录中...' : '登录后台' }}
          </button>
        </form>

        <div class="auth-tips">
          <p><strong>管理员：</strong>admin / admin123</p>
          <p><strong>普通用户：</strong>guest / guest123（仅浏览）</p>
        </div>
      </div>
    </section>
  </main>
</template>
