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

/** 鉴权服务抽象，便于本地模拟与 Supabase 切换 */
export interface AuthService {
  getSession: () => Promise<AuthUser | null>
  signUp: (email: string, password: string) => Promise<SignUpResult>
  signIn: (email: string, password: string) => Promise<AuthUser>
  signOut: () => Promise<void>
  onAuthStateChange: (callback: (user: AuthUser | null) => void) => () => void
}
