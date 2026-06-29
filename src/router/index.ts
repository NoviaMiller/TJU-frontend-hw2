import { createRouter, createWebHistory } from 'vue-router'

import { pinia } from '@/stores/pinia'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'
import PostDetailView from '@/views/PostDetailView.vue'
import AdminLoginView from '@/views/AdminLoginView.vue'
import AdminDashboardView from '@/views/AdminDashboardView.vue'
import AdminEditorView from '@/views/AdminEditorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: '课程 Wiki',
      },
    },
    {
      path: '/posts/:id',
      name: 'post-detail',
      component: PostDetailView,
      meta: {
        title: '文章详情',
      },
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: AdminLoginView,
      meta: {
        title: '后台登录',
      },
    },
    {
      path: '/admin/posts',
      name: 'admin-dashboard',
      component: AdminDashboardView,
      meta: {
        title: '文章管理',
        requiresAdmin: true,
      },
    },
    {
      path: '/admin/posts/create',
      name: 'admin-create',
      component: AdminEditorView,
      meta: {
        title: '发布文章',
        requiresAdmin: true,
      },
    },
    {
      path: '/admin/posts/:id/edit',
      name: 'admin-edit',
      component: AdminEditorView,
      meta: {
        title: '编辑文章',
        requiresAdmin: true,
      },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia)
  await authStore.ensureUserLoaded()

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return {
      name: 'admin-login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  const title = typeof to.meta.title === 'string' ? `${to.meta.title} · Wiki System` : 'Wiki System'
  document.title = title

  return true
})

export default router
