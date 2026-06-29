import { ref } from 'vue'
import { defineStore } from 'pinia'

const THEME_KEY = 'wiki-system-theme'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<'light' | 'dark'>('light')

  function apply() {
    if (typeof document === 'undefined') {
      return
    }

    document.documentElement.dataset.theme = mode.value
  }

  function hydrate() {
    if (typeof window === 'undefined') {
      return
    }

    const saved = window.localStorage.getItem(THEME_KEY)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    mode.value = saved === 'light' || saved === 'dark' ? saved : prefersDark ? 'dark' : 'light'
    apply()
  }

  function toggle() {
    mode.value = mode.value === 'light' ? 'dark' : 'light'

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_KEY, mode.value)
    }

    apply()
  }

  return {
    mode,
    hydrate,
    toggle,
  }
})
