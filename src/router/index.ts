import { createRouter, createWebHistory } from 'vue-router'

import { pinia } from '@/stores/pinia'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'
import LibraryView from '@/views/LibraryView.vue'
import PostDetailView from '@/views/PostDetailView.vue'
import AdminLoginView from '@/views/AdminLoginView.vue'
import AdminDashboardView from '@/views/AdminDashboardView.vue'
import AdminEditorView from '@/views/AdminEditorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    return {
      top: 0,
      left: 0,
    }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: '首页',
      },
    },
    {
      path: '/library',
      name: 'library',
      component: LibraryView,
      meta: {
        title: '古典文库',
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
      path: '/login',
      name: 'login',
      component: AdminLoginView,
      meta: {
        title: '登录',
      },
    },
    {
      path: '/admin/posts',
      name: 'admin-dashboard',
      component: AdminDashboardView,
      meta: {
        title: '管理台',
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
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  const title = typeof to.meta.title === 'string' ? `${to.meta.title} · 古典文库 Wiki` : '古典文库 Wiki'
  document.title = title

  return true
})

export default router
