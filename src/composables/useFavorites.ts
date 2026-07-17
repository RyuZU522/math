import { computed, ref, watch } from 'vue'
import { favoritesService } from '../services/favorites'
import { useAuth } from './useAuth'

const favoriteConceptIds = ref<string[]>([])
const isFavoritesLoading = ref(false)
const favoritesErrorMessage = ref('')
let favoritesWatchBound = false

const bindFavoritesWatcher = () => {
  if (favoritesWatchBound) return
  favoritesWatchBound = true

  const { currentUser } = useAuth()

  watch(
    currentUser,
    async (user) => {
      if (!user) {
        favoriteConceptIds.value = []
        return
      }

      isFavoritesLoading.value = true
      favoritesErrorMessage.value = ''
      try {
        favoriteConceptIds.value = await favoritesService.list(user.id)
      } catch (error) {
        favoritesErrorMessage.value =
          error instanceof Error ? error.message : '加载收藏失败'
      } finally {
        isFavoritesLoading.value = false
      }
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
      return
    }

    isFavoritesLoading.value = true
    favoritesErrorMessage.value = ''
    try {
      favoriteConceptIds.value = await favoritesService.list(currentUser.value.id)
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
        await favoritesService.remove(userId, conceptId)
        favoriteConceptIds.value = favoriteConceptIds.value.filter(
          (favoriteId) => favoriteId !== conceptId,
        )
      } else {
        await favoritesService.add(userId, conceptId)
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
