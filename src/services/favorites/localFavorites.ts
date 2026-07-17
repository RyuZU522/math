import type { FavoritesService } from './types'

const FAVORITES_STORAGE_KEY = 'mathviz.local.favorites'

type FavoritesMap = Record<string, string[]>

const readFavoritesMap = (): FavoritesMap => {
  try {
    const rawValue = localStorage.getItem(FAVORITES_STORAGE_KEY)
    return rawValue ? (JSON.parse(rawValue) as FavoritesMap) : {}
  } catch {
    return {}
  }
}

const writeFavoritesMap = (favoritesMap: FavoritesMap) => {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritesMap))
}

/** 本地收藏：按用户 ID 隔离存储 */
export const localFavoritesService: FavoritesService = {
  async list(userId: string) {
    return readFavoritesMap()[userId] ?? []
  },

  async add(userId: string, conceptId: string) {
    const favoritesMap = readFavoritesMap()
    const currentList = favoritesMap[userId] ?? []
    if (!currentList.includes(conceptId)) {
      favoritesMap[userId] = [...currentList, conceptId]
      writeFavoritesMap(favoritesMap)
    }
  },

  async remove(userId: string, conceptId: string) {
    const favoritesMap = readFavoritesMap()
    favoritesMap[userId] = (favoritesMap[userId] ?? []).filter(
      (favoriteId) => favoriteId !== conceptId,
    )
    writeFavoritesMap(favoritesMap)
  },
}
