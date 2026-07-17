import PinyinMatch from 'pinyin-match'
import type { MathConcept } from '../data/mockData'

/** 判断数学概念是否匹配搜索词，标题支持拼音匹配 */
export const matchesConcept = (concept: MathConcept, searchQuery: string): boolean => {
  const normalizedQuery = searchQuery.trim().toLowerCase().replace(/'/g, '')
  if (!normalizedQuery) return true

  if (PinyinMatch.match(concept.title, normalizedQuery)) return true

  return (
    concept.description.toLowerCase().includes(normalizedQuery)
    || concept.latexFormula.toLowerCase().includes(normalizedQuery)
    || concept.category.toLowerCase().includes(normalizedQuery)
  )
}
