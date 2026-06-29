<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const route = useRoute()
const router = useRouter()

const dashboardLink = computed(() =>
  authStore.isAdmin ? { name: 'admin-dashboard' } : { name: 'admin-login' },
)

function handleLogout() {
  authStore.signOut()

  if (route.meta.requiresAdmin) {
    void router.push({ name: 'home' })
  }
}
</script>

<template>
  <header class="site-header">
    <div class="container site-header__inner">
      <RouterLink class="brand" :to="{ name: 'home' }">
        <span class="brand__badge">W</span>
        <span>
          <strong>Wiki System</strong>
          <small>课程知识库与后台管理</small>
        </span>
      </RouterLink>

      <nav class="site-nav">
        <RouterLink class="site-nav__link" :to="{ name: 'home' }">前台首页</RouterLink>
        <RouterLink class="site-nav__link" :to="dashboardLink">
          {{ authStore.isAdmin ? '后台管理' : '管理员登录' }}
        </RouterLink>
      </nav>

      <div class="site-actions">
        <button class="ghost-button" type="button" @click="themeStore.toggle()">
          {{ themeStore.mode === 'light' ? '暗色模式' : '浅色模式' }}
        </button>

        <div v-if="authStore.user" class="user-chip">
          <img :src="authStore.user.avatar" :alt="authStore.user.name" />
          <div>
            <strong>{{ authStore.user.name }}</strong>
            <small>{{ authStore.user.role === 'admin' ? '管理员' : '普通用户' }}</small>
          </div>
        </div>

        <button v-if="authStore.user" class="ghost-button" type="button" @click="handleLogout">
          退出
        </button>
      </div>
    </div>
  </header>
</template>
