import { getSupabaseClient } from '../../lib/supabase'
import { mapAuthErrorMessage } from './mapAuthError'
import type { AuthService, AuthUser } from './types'

const mapSupabaseUser = (userId: string, email: string | undefined): AuthUser => ({
  id: userId,
  email: email ?? '',
})

/** Supabase 鉴权实现；配置环境变量后自动启用 */
export const createSupabaseAuthService = (): AuthService => {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase 未配置')
  }

  return {
    async getSession() {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw new Error(mapAuthErrorMessage(error, '读取会话失败'))
      const sessionUser = data.session?.user
      if (!sessionUser) return null
      return mapSupabaseUser(sessionUser.id, sessionUser.email)
    },

    async signUp(email: string, password: string) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw new Error(mapAuthErrorMessage(error, '注册失败'))
      if (!data.user) throw new Error('注册失败')

      return {
        user: mapSupabaseUser(data.user.id, data.user.email),
        // 开启邮箱确认时，注册成功但不会立刻返回 session
        sessionEstablished: Boolean(data.session),
      }
    },

    async signIn(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(mapAuthErrorMessage(error, '登录失败'))
      if (!data.user) throw new Error('登录失败')
      return mapSupabaseUser(data.user.id, data.user.email)
    },

    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw new Error(mapAuthErrorMessage(error, '退出失败'))
    },

    onAuthStateChange(callback) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        const sessionUser = session?.user
        callback(sessionUser ? mapSupabaseUser(sessionUser.id, sessionUser.email) : null)
      })
      return () => {
        data.subscription.unsubscribe()
      }
    },
  }
}
