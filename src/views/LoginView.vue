<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import '../style/auth.css'

const route = useRoute()
const router = useRouter()
const { signIn, authErrorMessage, isAuthSubmitting, clearAuthError } = useAuth()

const emailInput = ref('')
const passwordInput = ref('')

const handleSubmit = async () => {
  clearAuthError()
  try {
    await signIn(emailInput.value, passwordInput.value)
    const redirectPath =
      typeof route.query.redirect === 'string' ? route.query.redirect : '/favorites'
    await router.replace(redirectPath)
  } catch {
    // 错误文案由 composable 统一管理
  }
}
</script>

<template>
  <div class="auth-page">
    <section class="auth-card">
      <h1 class="auth-card__title">登录</h1>
      <p class="auth-card__subtitle">登录后可收藏知识点，并在「我的收藏」中查看。</p>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="auth-form__field">
          <label class="auth-form__label" for="login-email">邮箱</label>
          <input
            id="login-email"
            v-model="emailInput"
            class="auth-form__input"
            type="email"
            autocomplete="email"
            required
          />
        </div>

        <div class="auth-form__field">
          <label class="auth-form__label" for="login-password">密码</label>
          <input
            id="login-password"
            v-model="passwordInput"
            class="auth-form__input"
            type="password"
            autocomplete="current-password"
            required
            minlength="6"
          />
        </div>

        <p v-if="authErrorMessage" class="auth-form__error">{{ authErrorMessage }}</p>

        <button class="auth-form__submit" type="submit" :disabled="isAuthSubmitting">
          {{ isAuthSubmitting ? '登录中…' : '登录' }}
        </button>
      </form>

      <p class="auth-card__footer">
        还没有账号？
        <RouterLink :to="{ name: 'register', query: route.query }">去注册</RouterLink>
      </p>
    </section>
  </div>
</template>
