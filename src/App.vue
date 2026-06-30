<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import SiteHeader from '@/components/SiteHeader.vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const route = useRoute()
const isHomeRoute = computed(() => route.name === 'home')

function handleAuthExpired() {
  authStore.clearSession()
}

onMounted(() => {
  themeStore.hydrate()
  void authStore.ensureUserLoaded()

  window.addEventListener('auth:expired', handleAuthExpired)
})

onBeforeUnmount(() => {
  window.removeEventListener('auth:expired', handleAuthExpired)
})
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <SiteHeader v-if="!isHomeRoute" />
    <div id="main-content" class="route-shell" tabindex="-1">
      <RouterView />
    </div>
  </div>
</template>
