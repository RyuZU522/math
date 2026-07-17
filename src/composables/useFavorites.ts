import { computed, ref, watch } from 'vue'
import { getSupabaseClient } from '../lib/supabase'
import { useAuth } from './useAuth'

/**
 * Supabase 收藏表约定：
 * favorites(id uuid pk, user_id uuid, concept_id text, created_at timestamptz, unique(user_id, concept_id))
 */

/** 将收藏接口错误转为可读中文 */
const mapFavoritesErrorMessage = (error: unknown): string => {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error)

  const normalizedMessage = rawMessage.toLowerCase()

  if (
    normalizedMessage.includes('could not find the table')
    || normalizedMessage.includes('pgrst205')
    || normalizedMessage.includes("relation \"favorites\" does not exist")
  ) {
    return '收藏表尚未创建。请在 Supabase SQL Editor 执行 supabase/favorites.sql 后重试。'
  }

  if (
    normalizedMessage.includes('row-level security')
    || normalizedMessage.includes('42501')
    || normalizedMessage.includes('violates row-level security')
  ) {
    return '收藏权限不足。请确认已登录，并已执行 favorites.sql 中的 RLS 策略。'
  }

  return rawMessage || '收藏失败'
}

const requireSupabase = () => {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase 未配置')
  }
  return supabase
}

const listFavorites = async (userId: string): Promise<string[]> => {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('favorites')
    .select('concept_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(mapFavoritesErrorMessage(error))
  return (data ?? []).map((rowItem) => rowItem.concept_id as string)
}

const addFavorite = async (userId: string, conceptId: string) => {
  const supabase = requireSupabase()
  // 使用 insert，避免 upsert 额外需要 UPDATE 策略
  const { error } = await supabase.from('favorites').insert({
    user_id: userId,
    concept_id: conceptId,
  })

  if (!error) return

  // 已收藏时视为成功
  if (error.code === '23505') return

  throw new Error(mapFavoritesErrorMessage(error))
}

const removeFavorite = async (userId: string, conceptId: string) => {
  const supabase = requireSupabase()
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('concept_id', conceptId)

  if (error) throw new Error(mapFavoritesErrorMessage(error))
}

const favoriteConceptIds = ref<string[]>([])
const isFavoritesLoading = ref(false)
const favoritesErrorMessage = ref('')
let favoritesWatchBound = false

const bindFavoritesWatcher = () => {
  if (favoritesWatchBound) return
  favoritesWatchBound = true

  const { currentUser } = useAuth()

  // 按用户 ID 监听；请求推迟到下一宏任务，避开 Supabase onAuthStateChange 鉴权锁
  watch(
    () => currentUser.value?.id ?? null,
    (userId, _previousUserId, onCleanup) => {
      let cancelled = false
      const timeoutId = window.setTimeout(() => {
        void (async () => {
          if (!userId) {
            if (!cancelled) {
              favoriteConceptIds.value = []
              isFavoritesLoading.value = false
              favoritesErrorMessage.value = ''
            }
            return
          }

          if (!cancelled) {
            isFavoritesLoading.value = true
            favoritesErrorMessage.value = ''
          }

          try {
            const conceptIds = await listFavorites(userId)
            if (!cancelled) {
              favoriteConceptIds.value = conceptIds
            }
          } catch (error) {
            if (!cancelled) {
              favoritesErrorMessage.value =
                error instanceof Error ? error.message : '加载收藏失败'
            }
          } finally {
            if (!cancelled) {
              isFavoritesLoading.value = false
            }
          }
        })()
      }, 0)

      onCleanup(() => {
        cancelled = true
        window.clearTimeout(timeoutId)
      })
    },
    { immediate: true },
  )
}

/** 当前用户的收藏列表与切换操作 */
export const useFavorites = () => {
  const { currentUser, isLoggedIn } = useAuth()
  bindFavoritesWatcher()

  const favoriteIdSet = computed(() => new Set(favoriteConceptIds.value))

  const isFavorite = (conceptId: string) => favoriteIdSet.value.has(conceptId)

  const reloadFavorites = async () => {
    if (!currentUser.value) {
      favoriteConceptIds.value = []
      isFavoritesLoading.value = false
      return
    }

    isFavoritesLoading.value = true
    favoritesErrorMessage.value = ''
    try {
      favoriteConceptIds.value = await listFavorites(currentUser.value.id)
    } catch (error) {
      favoritesErrorMessage.value =
        error instanceof Error ? error.message : '加载收藏失败'
    } finally {
      isFavoritesLoading.value = false
    }
  }

  const toggleFavorite = async (conceptId: string) => {
    if (!currentUser.value) {
      throw new Error('请先登录后再收藏')
    }

    favoritesErrorMessage.value = ''
    const userId = currentUser.value.id
    const alreadyFavorite = isFavorite(conceptId)

    try {
      if (alreadyFavorite) {
        await removeFavorite(userId, conceptId)
        favoriteConceptIds.value = favoriteConceptIds.value.filter(
          (favoriteId) => favoriteId !== conceptId,
        )
      } else {
        await addFavorite(userId, conceptId)
        favoriteConceptIds.value = [...favoriteConceptIds.value, conceptId]
      }
    } catch (error) {
      favoritesErrorMessage.value =
        error instanceof Error ? error.message : '更新收藏失败'
      throw error
    }
  }

  return {
    favoriteConceptIds,
    isFavoritesLoading,
    favoritesErrorMessage,
    isLoggedIn,
    isFavorite,
    toggleFavorite,
    reloadFavorites,
  }
}
