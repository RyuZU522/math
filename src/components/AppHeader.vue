<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import '../style/auth.css'

const route = useRoute()
const router = useRouter()
const { currentUser, isLoggedIn, signOut } = useAuth()

const handleSignOut = async () => {
  await signOut()
  if (route.name === 'favorites') {
    await router.push({ name: 'login' })
  }
}
</script>

<template>
  <header class="app-header">
    <RouterLink class="app-header__brand" :to="{ name: 'dashboard' }">
      数学概念与公式可视化看板
    </RouterLink>

    <nav class="app-header__nav">
      <RouterLink
        class="app-header__link"
        :class="{ 'app-header__link--active': route.name === 'dashboard' }"
        :to="{ name: 'dashboard' }"
      >
        概念库
      </RouterLink>

      <RouterLink
        class="app-header__link"
        :class="{ 'app-header__link--active': route.name === 'favorites' }"
        :to="{ name: 'favorites' }"
      >
        我的收藏
      </RouterLink>

      <template v-if="isLoggedIn">
        <span class="app-header__user">{{ currentUser?.email }}</span>
        <button type="button" class="app-header__button" @click="handleSignOut">
          退出
        </button>
      </template>

      <template v-else>
        <RouterLink
          class="app-header__link"
          :class="{ 'app-header__link--active': route.name === 'login' }"
          :to="{ name: 'login', query: { redirect: '/favorites' } }"
        >
          登录
        </RouterLink>
        <RouterLink
          class="app-header__link"
          :class="{ 'app-header__link--active': route.name === 'register' }"
          :to="{ name: 'register', query: { redirect: '/favorites' } }"
        >
          注册
        </RouterLink>
      </template>
    </nav>
  </header>
</template>
