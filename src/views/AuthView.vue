<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useFavorites } from '../composables/useFavorites'
import '../style/auth.css'

const route = useRoute()
const router = useRouter()
const {
  signIn,
  signUp,
  authErrorMessage,
  authInfoMessage,
  isAuthSubmitting,
  clearAuthError,
} = useAuth()
const { reloadFavorites } = useFavorites()

const isRegisterMode = computed(() => route.name === 'register')

const emailInput = ref('')
const passwordInput = ref('')
const confirmPasswordInput = ref('')
const localErrorMessage = ref('')

watch(isRegisterMode, () => {
  clearAuthError()
  localErrorMessage.value = ''
  passwordInput.value = ''
  confirmPasswordInput.value = ''
})

const redirectAfterAuth = async () => {
  await reloadFavorites()
  const redirectPath =
    typeof route.query.redirect === 'string' ? route.query.redirect : '/favorites'
  await router.replace(redirectPath)
}

const handleSubmit = async () => {
  clearAuthError()
  localErrorMessage.value = ''

  try {
    if (isRegisterMode.value) {
      if (passwordInput.value !== confirmPasswordInput.value) {
        localErrorMessage.value = '两次输入的密码不一致'
        return
      }

      const signUpResult = await signUp(emailInput.value, passwordInput.value)
      if (!signUpResult.sessionEstablished) {
        // 需邮箱确认：停留当前页展示提示
        return
      }
      await redirectAfterAuth()
      return
    }

    await signIn(emailInput.value, passwordInput.value)
    await redirectAfterAuth()
  } catch {
    // 错误文案由 composable 统一管理
  }
}
</script>

<template>
  <div class="auth-page">
    <section class="auth-card">
      <h1 class="auth-card__title">{{ isRegisterMode ? '注册' : '登录' }}</h1>
      <p class="auth-card__subtitle">
        {{
          isRegisterMode
            ? '创建账号后即可收藏感兴趣的数学概念。'
            : '登录后可收藏知识点，并在「我的收藏」中查看。'
        }}
      </p>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="auth-form__field">
          <label class="auth-form__label" :for="isRegisterMode ? 'register-email' : 'login-email'">
            邮箱
          </label>
          <input
            :id="isRegisterMode ? 'register-email' : 'login-email'"
            v-model="emailInput"
            class="auth-form__input"
            type="email"
            autocomplete="email"
            required
          />
        </div>

        <div class="auth-form__field">
          <label
            class="auth-form__label"
            :for="isRegisterMode ? 'register-password' : 'login-password'"
          >
            密码
          </label>
          <input
            :id="isRegisterMode ? 'register-password' : 'login-password'"
            v-model="passwordInput"
            class="auth-form__input"
            type="password"
            :autocomplete="isRegisterMode ? 'new-password' : 'current-password'"
            required
            minlength="6"
          />
        </div>

        <div v-if="isRegisterMode" class="auth-form__field">
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
        <p v-else-if="isRegisterMode && authInfoMessage" class="auth-form__info">
          {{ authInfoMessage }}
        </p>

        <button class="auth-form__submit" type="submit" :disabled="isAuthSubmitting">
          <template v-if="isRegisterMode">
            {{ isAuthSubmitting ? '注册中…' : '注册' }}
          </template>
          <template v-else>
            {{ isAuthSubmitting ? '登录中…' : '登录' }}
          </template>
        </button>
      </form>

      <p class="auth-card__footer">
        <template v-if="isRegisterMode">
          已有账号？
          <RouterLink :to="{ name: 'login', query: route.query }">去登录</RouterLink>
        </template>
        <template v-else>
          还没有账号？
          <RouterLink :to="{ name: 'register', query: route.query }">去注册</RouterLink>
        </template>
      </p>
    </section>
  </div>
</template>
