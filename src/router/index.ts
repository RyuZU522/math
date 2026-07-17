import { createRouter, createWebHistory } from 'vue-router'
import { useAuth, waitForAuthReady } from '../composables/useAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('../views/FavoritesView.vue'),
      meta: { requiresAuth: true },
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  // 使用内存中的登录态，避免登录后导航再 await getSession 撞上 Supabase 鉴权锁
  await waitForAuthReady()
  const { currentUser } = useAuth()

  if (to.meta.requiresAuth && !currentUser.value) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.guestOnly && currentUser.value) {
    const redirectPath =
      typeof to.query.redirect === 'string' ? to.query.redirect : '/favorites'
    return redirectPath
  }

  return true
})

export default router
