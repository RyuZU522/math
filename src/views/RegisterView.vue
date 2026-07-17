<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useFavorites } from '../composables/useFavorites'
import '../style/auth.css'

const route = useRoute()
const router = useRouter()
const {
  signUp,
  authErrorMessage,
  authInfoMessage,
  isAuthSubmitting,
  clearAuthError,
} = useAuth()
const { reloadFavorites } = useFavorites()

const emailInput = ref('')
const passwordInput = ref('')
const confirmPasswordInput = ref('')
const localErrorMessage = ref('')

const handleSubmit = async () => {
  clearAuthError()
  localErrorMessage.value = ''

  if (passwordInput.value !== confirmPasswordInput.value) {
    localErrorMessage.value = '两次输入的密码不一致'
    return
  }

  try {
    const signUpResult = await signUp(emailInput.value, passwordInput.value)
    if (!signUpResult.sessionEstablished) {
      // 需邮箱确认：停留当前页展示提示
      return
    }

    await reloadFavorites()
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
      <h1 class="auth-card__title">注册</h1>
      <p class="auth-card__subtitle">创建账号后即可收藏感兴趣的数学概念。</p>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="auth-form__field">
          <label class="auth-form__label" for="register-email">邮箱</label>
          <input
            id="register-email"
            v-model="emailInput"
            class="auth-form__input"
            type="email"
            autocomplete="email"
            required
          />
        </div>

        <div class="auth-form__field">
          <label class="auth-form__label" for="register-password">密码</label>
          <input
            id="register-password"
            v-model="passwordInput"
            class="auth-form__input"
            type="password"
            autocomplete="new-password"
            required
            minlength="6"
          />
        </div>

        <div class="auth-form__field">
          <label class="auth-form__label" for="register-confirm">确认密码</label>
          <input
            id="register-confirm"
            v-model="confirmPasswordInput"
            class="auth-form__input"
            type="password"
            autocomplete="new-password"
            required
            minlength="6"
          />
        </div>

        <p v-if="localErrorMessage || authErrorMessage" class="auth-form__error">
          {{ localErrorMessage || authErrorMessage }}
        </p>
        <p v-else-if="authInfoMessage" class="auth-form__info">
          {{ authInfoMessage }}
        </p>

        <button class="auth-form__submit" type="submit" :disabled="isAuthSubmitting">
          {{ isAuthSubmitting ? '注册中…' : '注册' }}
        </button>
      </form>

      <p class="auth-card__footer">
        已有账号？
        <RouterLink :to="{ name: 'login', query: route.query }">去登录</RouterLink>
      </p>
    </section>
  </div>
</template>
