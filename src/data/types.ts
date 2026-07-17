/** 数学概念参数滑块定义 */
export interface ConceptParam {
  name: string
  /** URL 查询参数名，如 lambda、perturbation */
  queryKey: string
  min: number
  max: number
  step: number
  value: number
}

/** 数学概念数据结构 */
export interface MathConcept {
  id: string
  title: string
  category: '线性代数' | '微积分'
  latexFormula: string
  description: string
  hasInteractive: boolean
  defaultParams?: ConceptParam[]
  derivationSteps?: string[]
  details?: {
    intuitive: string
    rigorous: string
    application: string
  }
}

export const categories = [
  'All',
  '线性代数',
  '微积分',
] as const

export type CategoryFilter = (typeof categories)[number]
