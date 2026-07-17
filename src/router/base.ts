import type { RouteRecordRaw } from 'vue-router'

/** 基础路由：无需登录即可访问 */
export const baseRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/AuthView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/AuthView.vue'),
    meta: { guestOnly: true },
  },
]
