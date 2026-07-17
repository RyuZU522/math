/** 将收藏接口错误转为可读中文 */
export const mapFavoritesErrorMessage = (error: unknown): string => {
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
