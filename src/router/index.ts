import { createRouter, createWebHistory } from 'vue-router'
import { useAuth, waitForAuthReady } from '../composables/useAuth'
import { ajaxRoutes } from './ajax'
import { baseRoutes } from './base'

const router = createRouter({
  history: createWebHistory(),
  routes: [...baseRoutes, ...ajaxRoutes],
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
