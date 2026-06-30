<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({
  username: '',
  password: '',
})

const loading = ref(false)
const errorMessage = ref('')

async function submitLogin() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await authStore.signIn({
      username: form.username,
      password: form.password,
    })

    const redirect =
      typeof route.query.redirect === 'string'
        ? route.query.redirect
        : response.user.role === 'admin'
          ? '/admin/posts'
          : '/'
    await router.push(redirect)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请确认账号密码'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="page-shell">
    <section class="container auth-shell">
      <div class="auth-card">
        <span class="eyebrow">统一登录</span>
        <h1>登录古典文库 Wiki</h1>
        <p>这是站点的统一登录入口。管理员登录后可进入后台维护文章，普通用户登录后可以参与阅读与评论。</p>

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
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>

        <div class="auth-tips">
          <p><strong>管理员：</strong>admin / admin123</p>
          <p><strong>读者账号：</strong>guest / guest123</p>
          <p><strong>备用读者：</strong>yuki / yuki123，frontend / front123</p>
        </div>
      </div>
    </section>
  </main>
</template>
