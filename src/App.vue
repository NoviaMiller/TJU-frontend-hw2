<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

import SiteHeader from '@/components/SiteHeader.vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const authStore = useAuthStore()
const themeStore = useThemeStore()

onMounted(() => {
  themeStore.hydrate()
  void authStore.ensureUserLoaded()

  window.addEventListener('auth:expired', authStore.clearSession)
})
</script>

<template>
  <div class="app-shell">
    <SiteHeader />
    <RouterView />
  </div>
</template>
