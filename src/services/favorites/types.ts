/** 收藏服务抽象 */
export interface FavoritesService {
  list: (userId: string) => Promise<string[]>
  add: (userId: string, conceptId: string) => Promise<void>
  remove: (userId: string, conceptId: string) => Promise<void>
}
