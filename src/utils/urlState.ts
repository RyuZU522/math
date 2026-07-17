/** 看板 URL 序列化状态 */
interface DashboardUrlState {
  conceptId: string | null
  paramValues: Record<string, number>
}

const CONCEPT_QUERY_KEY = 'concept'

/** 将数值格式化为紧凑的查询串，避免浮点噪声 */
const formatQueryNumber = (value: number): string => {
  const rounded = Math.round(value * 10000) / 10000
  return String(rounded)
}

/** 从当前地址栏解析概念与参数 */
export const readDashboardUrlState = (
  search: string = window.location.search,
): DashboardUrlState => {
  const searchParams = new URLSearchParams(search)
  const conceptId = searchParams.get(CONCEPT_QUERY_KEY)
  const paramValues: Record<string, number> = {}

  searchParams.forEach((rawValue, queryKey) => {
    if (queryKey === CONCEPT_QUERY_KEY) return
    const parsedValue = Number(rawValue)
    if (Number.isFinite(parsedValue)) {
      paramValues[queryKey] = parsedValue
    }
  })

  return { conceptId, paramValues }
}

/** 将看板状态写入查询串（不含 ?） */
const buildDashboardSearch = (
  conceptId: string,
  params: Array<{ queryKey: string; value: number }>,
): string => {
  const searchParams = new URLSearchParams()
  searchParams.set(CONCEPT_QUERY_KEY, conceptId)
  params.forEach((paramItem) => {
    searchParams.set(paramItem.queryKey, formatQueryNumber(paramItem.value))
  })
  return searchParams.toString()
}

/**
 * 用 replaceState 同步 URL，避免滑块拖动产生大量历史记录。
 * 返回是否实际发生了变更。
 */
export const replaceDashboardUrl = (
  conceptId: string,
  params: Array<{ queryKey: string; value: number }>,
): boolean => {
  const nextSearch = buildDashboardSearch(conceptId, params)
  const nextUrl = nextSearch
    ? `${window.location.pathname}?${nextSearch}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`

  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (currentUrl === nextUrl) return false

  window.history.replaceState(window.history.state, '', nextUrl)
  return true
}

/** 生成可分享的完整链接 */
export const buildShareableUrl = (
  conceptId: string,
  params: Array<{ queryKey: string; value: number }>,
): string => {
  const search = buildDashboardSearch(conceptId, params)
  return `${window.location.origin}${window.location.pathname}?${search}`
}

/** 将数值限制在参数合法区间内 */
export const clampParamValue = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))
