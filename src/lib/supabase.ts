import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

/** 是否已配置 Supabase 环境变量 */
export const isSupabaseConfigured = (): boolean => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  return Boolean(supabaseUrl && supabaseAnonKey)
}

/** 获取单例 Supabase 客户端；未配置时返回 null */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null

  if (!supabaseClient) {
    supabaseClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )
  }

  return supabaseClient
}
