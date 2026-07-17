import { getSupabaseClient } from '../../lib/supabase'
import { mapFavoritesErrorMessage } from './mapFavoritesError'
import type { FavoritesService } from './types'

/**
 * Supabase 收藏表约定：
 * favorites(id uuid pk, user_id uuid, concept_id text, created_at timestamptz, unique(user_id, concept_id))
 */
export const createSupabaseFavoritesService = (): FavoritesService => {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase 未配置')
  }

  return {
    async list(userId: string) {
      const { data, error } = await supabase
        .from('favorites')
        .select('concept_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(mapFavoritesErrorMessage(error))
      return (data ?? []).map((rowItem) => rowItem.concept_id as string)
    },

    async add(userId: string, conceptId: string) {
      // 使用 insert，避免 upsert 额外需要 UPDATE 策略
      const { error } = await supabase.from('favorites').insert({
        user_id: userId,
        concept_id: conceptId,
      })

      if (!error) return

      // 已收藏时视为成功
      if (error.code === '23505') return

      throw new Error(mapFavoritesErrorMessage(error))
    },

    async remove(userId: string, conceptId: string) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('concept_id', conceptId)

      if (error) throw new Error(mapFavoritesErrorMessage(error))
    },
  }
}
