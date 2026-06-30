<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const route = useRoute()
const router = useRouter()

type NavLink = {
  label: string
  to: { name: 'home' | 'library' | 'login' | 'admin-dashboard' }
  active: boolean
}

const entryLink = computed(() => {
  if (!authStore.isAuthenticated) {
    return { name: 'login' as const }
  }

  if (authStore.isAdmin) {
    return { name: 'admin-dashboard' as const }
  }

  return { name: 'home' as const }
})

const entryLabel = computed(() => {
  if (!authStore.isAuthenticated) {
    return '登录'
  }

  return authStore.isAdmin ? '后台管理' : '已登录'
})

const navLinks = computed<NavLink[]>(() => {
  const links: NavLink[] = [
    {
      label: '首页',
      to: { name: 'home' as const },
      active: route.name === 'home',
    },
    {
      label: '进入文库',
      to: { name: 'library' as const },
      active: route.name === 'library' || route.name === 'post-detail',
    },
  ]

  if (!authStore.isAuthenticated) {
    links.push({
      label: '登录',
      to: { name: 'login' as const },
      active: route.name === 'login',
    })

    return links
  }

  if (authStore.isAdmin) {
    links.push({
      label: '后台管理',
      to: { name: 'admin-dashboard' as const },
      active:
        route.name === 'admin-dashboard' ||
        route.name === 'admin-create' ||
        route.name === 'admin-edit',
    })
  }

  return links
})

const themeButtonLabel = computed(() =>
  themeStore.mode === 'light' ? '切换为暗色' : '切换为亮色',
)

const themeMetaLabel = computed(() =>
  themeStore.mode === 'light' ? '当前亮色主题' : '当前暗色主题',
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
        <span class="brand__copy">
          <strong>古典文库 Wiki</strong>
          <small>先秦经典阅读与内容管理</small>
        </span>
      </RouterLink>

      <nav class="site-nav" aria-label="主导航">
        <RouterLink
          v-for="link in navLinks"
          :key="link.label"
          class="site-nav__link"
          :class="{ 'site-nav__link--active': link.active }"
          :to="link.to"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="site-actions">
        <button
          class="ghost-button ghost-button--meta"
          type="button"
          :aria-label="themeButtonLabel"
          @click="themeStore.toggle()"
        >
          <span class="ghost-button__label">{{ themeButtonLabel }}</span>
          <small>{{ themeMetaLabel }}</small>
        </button>

        <div v-if="authStore.user" class="user-chip">
          <img :src="authStore.user.avatar" :alt="authStore.user.name" />
          <div class="user-chip__copy">
            <strong>{{ authStore.user.name }}</strong>
            <small>@{{ authStore.user.username }} · {{ authStore.displayRole }}</small>
          </div>
        </div>

        <button v-if="authStore.user" class="ghost-button" type="button" @click="handleLogout">
          退出登录
        </button>

        <RouterLink v-else class="primary-button primary-button--compact primary-button--with-orb" :to="entryLink">
          <span>{{ entryLabel }}</span>
          <span class="button-orb" aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </div>
  </header>
</template>
