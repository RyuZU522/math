import { computed, ref, watch } from 'vue'
import { authService, type AuthUser } from '../services/auth'
import type { SignUpResult } from '../services/auth/types'
import { mapAuthErrorMessage } from '../services/auth/mapAuthError'

const currentUser = ref<AuthUser | null>(null)
const isAuthReady = ref(false)
const authErrorMessage = ref('')
const authInfoMessage = ref('')
const isAuthSubmitting = ref(false)

let authInitialized = false
let authReadyPromise: Promise<void> | null = null

const applyCurrentUser = (user: AuthUser | null) => {
  const previousUserId = currentUser.value?.id ?? null
  const nextUserId = user?.id ?? null
  // 同用户仅更新引用时跳过，避免触发收藏等依赖重复加载
  if (
    previousUserId === nextUserId &&
    (previousUserId === null || currentUser.value?.email === user?.email)
  ) {
    return
  }
  currentUser.value = user
}

const ensureAuthSubscription = () => {
  if (authInitialized) return
  authInitialized = true

  authReadyPromise = new Promise<void>((resolve) => {
    const markReady = () => {
      if (!isAuthReady.value) {
        isAuthReady.value = true
        resolve()
      }
    }

    // 必须把状态更新推迟到鉴权回调之外，否则后续 Supabase 请求会卡在 auth lock
    authService.onAuthStateChange((user) => {
      window.setTimeout(() => {
        applyCurrentUser(user)
        markReady()
      }, 0)
    })

    void authService.getSession().then((user) => {
      applyCurrentUser(user)
      markReady()
    })
  })
}

/** 等待首次鉴权就绪（供路由守卫使用，避免每次导航都打 getSession） */
export const waitForAuthReady = async () => {
  ensureAuthSubscription()
  if (isAuthReady.value) return
  if (authReadyPromise) {
    await authReadyPromise
    return
  }
  await new Promise<void>((resolve) => {
    const stopWatch = watch(isAuthReady, (ready) => {
      if (ready) {
        stopWatch()
        resolve()
      }
    })
  })
}

/** 全局鉴权状态与登录注册操作 */
export const useAuth = () => {
  ensureAuthSubscription()

  const isLoggedIn = computed(() => Boolean(currentUser.value))

  const clearAuthError = () => {
    authErrorMessage.value = ''
    authInfoMessage.value = ''
  }

  const signUp = async (email: string, password: string): Promise<SignUpResult> => {
    isAuthSubmitting.value = true
    authErrorMessage.value = ''
    authInfoMessage.value = ''
    try {
      const signUpResult = await authService.signUp(email, password)
      if (!signUpResult.sessionEstablished) {
        authInfoMessage.value =
          '注册成功。请先到邮箱点击确认链接，再回来登录。若本地开发可到 Supabase → Authentication → Providers → Email 关闭 Confirm email。'
      } else {
        applyCurrentUser(signUpResult.user)
      }
      return signUpResult
    } catch (error) {
      authErrorMessage.value = mapAuthErrorMessage(error, '注册失败')
      throw error
    } finally {
      isAuthSubmitting.value = false
    }
  }

  const signIn = async (email: string, password: string) => {
    isAuthSubmitting.value = true
    authErrorMessage.value = ''
    authInfoMessage.value = ''
    try {
      const authUser = await authService.signIn(email, password)
      applyCurrentUser(authUser)
      return authUser
    } catch (error) {
      authErrorMessage.value = mapAuthErrorMessage(error, '登录失败')
      throw error
    } finally {
      isAuthSubmitting.value = false
    }
  }

  const signOut = async () => {
    authErrorMessage.value = ''
    authInfoMessage.value = ''
    await authService.signOut()
    applyCurrentUser(null)
  }

  return {
    currentUser,
    isAuthReady,
    isLoggedIn,
    authErrorMessage,
    authInfoMessage,
    isAuthSubmitting,
    clearAuthError,
    signUp,
    signIn,
    signOut,
  }
}
