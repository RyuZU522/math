import { computed, ref } from 'vue'
import { authService, type AuthUser } from '../services/auth'
import type { SignUpResult } from '../services/auth/types'
import { mapAuthErrorMessage } from '../services/auth/mapAuthError'

const currentUser = ref<AuthUser | null>(null)
const isAuthReady = ref(false)
const authErrorMessage = ref('')
const authInfoMessage = ref('')
const isAuthSubmitting = ref(false)

let authInitialized = false

const ensureAuthSubscription = () => {
  if (authInitialized) return
  authInitialized = true

  // 单例订阅，生命周期与应用一致
  authService.onAuthStateChange((user) => {
    currentUser.value = user
    isAuthReady.value = true
  })

  void authService.getSession().then((user) => {
    currentUser.value = user
    isAuthReady.value = true
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
        currentUser.value = signUpResult.user
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
      currentUser.value = authUser
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
    currentUser.value = null
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
