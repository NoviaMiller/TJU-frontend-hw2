import axios from 'axios'

import { mockAdapter } from '@/mocks/server'

const TOKEN_KEY = 'wiki-system-token'

export const http = axios.create({
  baseURL: '/api',
  adapter: mockAdapter,
})

http.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event('auth:expired'))
    }

    return Promise.reject(error)
  },
)

export { TOKEN_KEY }
