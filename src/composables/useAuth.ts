/** 类型、错误文案、Supabase 登录/注册/会话、全局状态 */
import { computed, ref, watch } from 'vue'
import { getSupabaseClient } from '../lib/supabase'

/** 当前登录用户 */
export interface AuthUser {
  id: string
  email: string
}

/** 注册结果：区分“已登录”与“需邮箱确认” */
export interface SignUpResult {
  user: AuthUser
  /** 是否已建立会话；false 表示需先到邮箱确认 */
  sessionEstablished: boolean
}

/** 将 Supabase / 网络错误转为中文提示 */
const mapAuthErrorMessage = (error: unknown, fallbackMessage: string): string => {
  const rawMessage = error instanceof Error ? error.message : String(error)
  const normalizedMessage = rawMessage.toLowerCase()

  if (
    normalizedMessage.includes('email not confirmed')
    || normalizedMessage.includes('email_not_confirmed')
  ) {
    return '邮箱尚未确认。请先打开注册邮件完成验证，或在 Supabase 后台关闭“Confirm email”。'
  }

  if (normalizedMessage.includes('invalid login credentials')) {
    return '邮箱或密码错误'
  }

  if (normalizedMessage.includes('user already registered')) {
    return '该邮箱已注册，请直接登录'
  }

  if (normalizedMessage.includes('password')) {
    return '密码不符合要求，请使用至少 6 位密码'
  }

  return rawMessage || fallbackMessage
}

const mapSupabaseUser = (userId: string, email: string | undefined): AuthUser => ({
  id: userId,
  email: email ?? '',
})

const requireSupabase = () => {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase 未配置')
  }
  return supabase
}

const getSession = async (): Promise<AuthUser | null> => {
  const supabase = requireSupabase()
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(mapAuthErrorMessage(error, '读取会话失败'))
  const sessionUser = data.session?.user
  if (!sessionUser) return null
  return mapSupabaseUser(sessionUser.id, sessionUser.email)
}

const signUpWithSupabase = async (email: string, password: string): Promise<SignUpResult> => {
  const supabase = requireSupabase()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(mapAuthErrorMessage(error, '注册失败'))
  if (!data.user) throw new Error('注册失败')

  return {
    user: mapSupabaseUser(data.user.id, data.user.email),
    // 开启邮箱确认时，注册成功但不会立刻返回 session
    sessionEstablished: Boolean(data.session),
  }
}

const signInWithSupabase = async (email: string, password: string): Promise<AuthUser> => {
  const supabase = requireSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(mapAuthErrorMessage(error, '登录失败'))
  if (!data.user) throw new Error('登录失败')
  return mapSupabaseUser(data.user.id, data.user.email)
}

const signOutFromSupabase = async () => {
  const supabase = requireSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(mapAuthErrorMessage(error, '退出失败'))
}

const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  const supabase = requireSupabase()
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const sessionUser = session?.user
    callback(sessionUser ? mapSupabaseUser(sessionUser.id, sessionUser.email) : null)
  })
  return () => {
    data.subscription.unsubscribe()
  }
}

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
    onAuthStateChange((user) => {
      window.setTimeout(() => {
        applyCurrentUser(user)
        markReady()
      }, 0)
    })

    void getSession().then((user) => {
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
      const signUpResult = await signUpWithSupabase(email, password)
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
      const authUser = await signInWithSupabase(email, password)
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
    await signOutFromSupabase()
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
