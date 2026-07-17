import type { RouteRecordRaw } from 'vue-router'

/** 业务路由：需登录后访问（异步按需加载） */
export const ajaxRoutes: RouteRecordRaw[] = [
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('../views/FavoritesView.vue'),
    meta: { requiresAuth: true },
  },
]
