import { isSupabaseConfigured } from '../../lib/supabase'
import { localFavoritesService } from './localFavorites'
import { createSupabaseFavoritesService } from './supabaseFavorites'
import type { FavoritesService } from './types'

let cachedFavoritesService: FavoritesService | null = null

/** 已配置 Supabase 时走云端，否则使用本地模拟 */
export const getFavoritesService = (): FavoritesService => {
  if (!cachedFavoritesService) {
    cachedFavoritesService = isSupabaseConfigured()
      ? createSupabaseFavoritesService()
      : localFavoritesService
  }
  return cachedFavoritesService
}

/** 兼容现有调用方 */
export const favoritesService: FavoritesService = {
  list: (...args) => getFavoritesService().list(...args),
  add: (...args) => getFavoritesService().add(...args),
  remove: (...args) => getFavoritesService().remove(...args),
}
