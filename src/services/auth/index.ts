import { isSupabaseConfigured } from '../../lib/supabase'
import { localAuthService } from './localAuth'
import { createSupabaseAuthService } from './supabaseAuth'
import type { AuthService } from './types'

export type { AuthUser, SignUpResult } from './types'

let cachedAuthService: AuthService | null = null

/** 已配置 Supabase 时走云端，否则使用本地模拟 */
export const getAuthService = (): AuthService => {
  if (!cachedAuthService) {
    cachedAuthService = isSupabaseConfigured()
      ? createSupabaseAuthService()
      : localAuthService
  }
  return cachedAuthService
}

/** 兼容现有调用方 */
export const authService: AuthService = {
  getSession: (...args) => getAuthService().getSession(...args),
  signUp: (...args) => getAuthService().signUp(...args),
  signIn: (...args) => getAuthService().signIn(...args),
  signOut: (...args) => getAuthService().signOut(...args),
  onAuthStateChange: (...args) => getAuthService().onAuthStateChange(...args),
}
