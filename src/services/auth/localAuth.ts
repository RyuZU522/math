import type { AuthService, AuthUser } from './types'

const USERS_STORAGE_KEY = 'mathviz.local.users'
const SESSION_STORAGE_KEY = 'mathviz.local.session'

interface LocalUserRecord {
  id: string
  email: string
  password: string
}

type AuthListener = (user: AuthUser | null) => void

const authListeners = new Set<AuthListener>()

const readUsers = (): LocalUserRecord[] => {
  try {
    const rawValue = localStorage.getItem(USERS_STORAGE_KEY)
    return rawValue ? (JSON.parse(rawValue) as LocalUserRecord[]) : []
  } catch {
    return []
  }
}

const writeUsers = (users: LocalUserRecord[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

const readSession = (): AuthUser | null => {
  try {
    const rawValue = localStorage.getItem(SESSION_STORAGE_KEY)
    return rawValue ? (JSON.parse(rawValue) as AuthUser) : null
  } catch {
    return null
  }
}

const writeSession = (user: AuthUser | null) => {
  if (!user) {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } else {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
  }
  authListeners.forEach((listener) => listener(user))
}

const toAuthUser = (record: LocalUserRecord): AuthUser => ({
  id: record.id,
  email: record.email,
})

/** 本地鉴权：开发阶段模拟，后续可无缝切换 Supabase */
export const localAuthService: AuthService = {
  async getSession() {
    return readSession()
  },

  async signUp(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || password.length < 6) {
      throw new Error('请输入有效邮箱，且密码不少于 6 位')
    }

    const users = readUsers()
    if (users.some((userItem) => userItem.email === normalizedEmail)) {
      throw new Error('该邮箱已注册')
    }

    const newUser: LocalUserRecord = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      password,
    }
    writeUsers([...users, newUser])

    const authUser = toAuthUser(newUser)
    writeSession(authUser)
    return {
      user: authUser,
      sessionEstablished: true,
    }
  },

  async signIn(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase()
    const matchedUser = readUsers().find(
      (userItem) => userItem.email === normalizedEmail && userItem.password === password,
    )
    if (!matchedUser) {
      throw new Error('邮箱或密码错误')
    }

    const authUser = toAuthUser(matchedUser)
    writeSession(authUser)
    return authUser
  },

  async signOut() {
    writeSession(null)
  },

  onAuthStateChange(callback) {
    authListeners.add(callback)
    callback(readSession())
    return () => {
      authListeners.delete(callback)
    }
  },
}
