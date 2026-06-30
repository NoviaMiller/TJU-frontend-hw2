import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { TOKEN_KEY } from '@/api/http'
import { getCurrentUser, login } from '@/api/services'
import type { LoginPayload, User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const user = ref<User | null>(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value))
  const isAdmin = computed(() => user.value?.role === 'admin')
  const displayRole = computed(() => (user.value?.role === 'admin' ? '管理员' : '普通用户'))

  function hydrateToken() {
    if (typeof window === 'undefined') {
      return
    }

    token.value = window.localStorage.getItem(TOKEN_KEY) ?? ''
  }

  function clearSession() {
    token.value = ''
    user.value = null

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY)
    }
  }

  async function ensureUserLoaded() {
    if (!initialized.value) {
      hydrateToken()
      initialized.value = true
    }

    if (!token.value) {
      user.value = null
      return
    }

    if (user.value) {
      return
    }

    try {
      user.value = await getCurrentUser()
    } catch {
      clearSession()
    }
  }

  async function signIn(payload: LoginPayload) {
    const response = await login(payload)
    token.value = response.token
    user.value = response.user
    initialized.value = true

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, response.token)
    }

    return response
  }

  function signOut() {
    clearSession()
  }

  return {
    token,
    user,
    initialized,
    isAuthenticated,
    isAdmin,
    displayRole,
    ensureUserLoaded,
    signIn,
    signOut,
    clearSession,
  }
})
